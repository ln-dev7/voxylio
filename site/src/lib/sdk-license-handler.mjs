import {
  bearerSdkLicenseKey,
  parseSdkOrigin,
  parseSemver,
  sdkCorsHeaders,
  sdkDomainAllowed,
  sdkRateLimitSubject,
  sdkRequestDomainMatches,
  sdkVersionAllowed,
  verifySdkLicenseSecret,
} from "./sdk-license.mjs";

function errorResponse(status, reason, headers, extraHeaders = {}) {
  return Response.json(
    { valid: false, reason },
    { status, headers: { ...headers, ...extraHeaders } },
  );
}

export function sdkLicenseOptions(req) {
  const parsedOrigin = parseSdkOrigin(req.headers.get("origin"));
  if (!parsedOrigin) return new Response(null, { status: 403 });
  const requestedMethod = req.headers.get("access-control-request-method");
  if (requestedMethod && requestedMethod.toUpperCase() !== "POST") {
    return new Response(null, { status: 405 });
  }
  return new Response(null, {
    status: 204,
    headers: sdkCorsHeaders(parsedOrigin.origin),
  });
}

export function sdkClientNetworkAddress(req) {
  const vercel = req.headers.get("x-vercel-forwarded-for");
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0];
  return (vercel || forwarded || req.headers.get("x-real-ip") || "unknown")
    .trim()
    .slice(0, 160);
}

/** HTTP policy separated from its database adapter for route-level tests. */
export async function verifySdkLicenseRequest(req, deps) {
  const parsedOrigin = parseSdkOrigin(req.headers.get("origin"));
  if (!parsedOrigin) {
    return errorResponse(400, "invalid_origin", { "Cache-Control": "no-store" });
  }
  const cors = sdkCorsHeaders(parsedOrigin.origin);
  const credential = bearerSdkLicenseKey(req.headers.get("authorization"));
  if (!credential) return errorResponse(401, "invalid_license", cors);
  if (typeof deps.pepper !== "string" || deps.pepper.length < 32) {
    deps.logError?.("SDK licence verification is not configured");
    return errorResponse(503, "service_unavailable", cors);
  }

  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > 1024) {
    return errorResponse(413, "payload_too_large", cors);
  }

  let body;
  try {
    const raw = await req.text();
    if (raw.length > 1024) return errorResponse(413, "payload_too_large", cors);
    body = JSON.parse(raw);
  } catch {
    return errorResponse(400, "bad_json", cors);
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return errorResponse(400, "bad_request", cors);
  }
  const sdkVersion =
    typeof body.sdkVersion === "string" ? body.sdkVersion.slice(0, 64) : "";
  if (!parseSemver(sdkVersion)) {
    return errorResponse(400, "invalid_sdk_version", cors);
  }
  if (!sdkRequestDomainMatches(parsedOrigin.hostname, body.domain)) {
    return errorResponse(400, "origin_mismatch", cors);
  }

  try {
    const networkAddress = (deps.clientNetworkAddress || sdkClientNetworkAddress)(req);
    const preAuthSubject = sdkRateLimitSubject(
      "preauth",
      networkAddress,
      deps.pepper,
    );
    const preAuthRate = await deps.consumePreAuthRateLimit(preAuthSubject);
    if (!preAuthRate.allowed) {
      return errorResponse(429, "rate_limited", cors, {
        "X-RateLimit-Limit": String(preAuthRate.limit),
        "X-RateLimit-Remaining": String(preAuthRate.remaining),
        "Retry-After": String(preAuthRate.retryAfter),
      });
    }

    const license = await deps.findLicense(credential.id);
    if (
      !license ||
      !verifySdkLicenseSecret(
        credential.id,
        credential.secret,
        license.secretHash,
        deps.pepper,
      )
    ) {
      return errorResponse(401, "invalid_license", cors);
    }
    if (license.status !== "active") {
      return errorResponse(403, "license_inactive", cors);
    }
    if (license.expiresAt && new Date(license.expiresAt).getTime() <= Date.now()) {
      return errorResponse(403, "license_expired", cors);
    }
    if (
      !sdkVersionAllowed(
        sdkVersion,
        license.minSdkVersion,
        license.maxSdkVersion,
      )
    ) {
      return errorResponse(403, "sdk_version_not_allowed", cors);
    }

    const domains = await deps.listDomains(license.id);
    if (!sdkDomainAllowed(parsedOrigin.hostname, domains)) {
      return errorResponse(403, "domain_not_allowed", cors);
    }

    // Only a valid grant consumes a per-licence + per-client bucket. A copied
    // browser key therefore cannot exhaust capacity for every real learner.
    const subjectHash = sdkRateLimitSubject(
      license.id,
      networkAddress,
      deps.pepper,
    );
    const rate = await deps.consumeRateLimit(subjectHash);
    const rateHeaders = {
      "X-RateLimit-Limit": String(rate.limit),
      "X-RateLimit-Remaining": String(rate.remaining),
    };
    if (!rate.allowed) {
      return errorResponse(429, "rate_limited", cors, {
        ...rateHeaders,
        "Retry-After": String(rate.retryAfter),
      });
    }

    try {
      await deps.touchLicense(license.id);
    } catch (error) {
      deps.logError?.("SDK licence last-verified update failed", {
        licenseId: license.id,
        error,
      });
    }

    const checkedAt = new Date();
    const expiresAt = license.expiresAt
      ? new Date(license.expiresAt).toISOString()
      : undefined;
    return Response.json(
      {
        valid: true,
        ...(expiresAt ? { expiresAt } : {}),
        license: {
          id: license.id,
          status: "active",
          expiresAt: expiresAt ?? null,
        },
        sdk: {
          version: sdkVersion,
          minVersion: license.minSdkVersion,
          maxVersion: license.maxSdkVersion,
        },
        capabilities: {
          localDubbing: true,
          localVoices: true,
          deviceTranslation: true,
          cloudMediaProcessing: false,
        },
        checkedAt: checkedAt.toISOString(),
        refreshAfter: new Date(checkedAt.getTime() + 10 * 60_000).toISOString(),
      },
      { headers: { ...cors, ...rateHeaders } },
    );
  } catch (error) {
    deps.logError?.("SDK licence verification failed", { error });
    return errorResponse(503, "service_unavailable", cors);
  }
}

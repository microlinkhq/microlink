;(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined'
    ? (module.exports = factory())
    : typeof define === 'function' && define.amd
      ? define(factory)
      : ((global =
        typeof globalThis !== 'undefined' ? globalThis : global || self),
      (global.mql = factory()))
})(this, function () {
  'use strict'

  function getDefaultExportFromCjs (x) {
    return x &&
      x.__esModule &&
      Object.prototype.hasOwnProperty.call(x, 'default')
      ? x['default']
      : x
  }

  function getAugmentedNamespace (n) {
    if (Object.prototype.hasOwnProperty.call(n, '__esModule')) return n
    var f = n.default
    if (typeof f == 'function') {
      var a = function a () {
        var isInstance = false
        try {
          isInstance = this instanceof a
        } catch (e) {}
        if (isInstance) {
          return Reflect.construct(f, arguments, this.constructor)
        }
        return f.apply(this, arguments)
      }
      a.prototype = f.prototype
    } else a = {}
    Object.defineProperty(a, '__esModule', { value: true })
    Object.keys(n).forEach(function (k) {
      var d = Object.getOwnPropertyDescriptor(n, k)
      Object.defineProperty(
        a,
        k,
        d.get
          ? d
          : {
            enumerable: true,
            get: function () {
              return n[k]
            }
          }
      )
    })
    return a
  }

  var src = { exports: {} }

  var dist = {}

  function iter (output, nullish, sep, val, key) {
    var k,
      pfx = key ? key + sep : key

    if (val == null) {
      if (nullish) output[key] = val
    } else if (typeof val != 'object') {
      output[key] = val
    } else if (Array.isArray(val)) {
      for (k = 0; k < val.length; k++) {
        iter(output, nullish, sep, val[k], pfx + k)
      }
    } else {
      for (k in val) {
        iter(output, nullish, sep, val[k], pfx + k)
      }
    }
  }

  function flattie (input, glue, toNull) {
    var output = {}
    if (typeof input == 'object') {
      iter(output, !!toNull, glue || '.', input, '')
    }
    return output
  }

  dist.flattie = flattie

  /**
	Base class for all Ky-specific errors. `HTTPError`, `NetworkError`, `TimeoutError`, and `ForceRetryError` extend this class.

	You can use `instanceof KyError` to check if an error originated from Ky, or use the `isKyError()` type guard for cross-realm compatibility and TypeScript type narrowing.

	Note: `SchemaValidationError` is intentionally not considered a Ky error. `KyError` covers failures in Ky's HTTP lifecycle (bad status, timeout, retry), while schema validation errors originate from the user-provided schema, not from Ky itself.
	*/
  class KyError extends Error {
    name = 'KyError'
    get isKyError () {
      return true
    }
  }

  /**
	Error thrown when the response has a non-2xx status code and `throwHttpErrors` is enabled.

	The error has a `response` property with the `Response` object, a `request` property with the `Request` object, an `options` property with the normalized options (either passed to `ky` when creating an instance with `ky.create()` or directly when performing the request), and a `data` property with the pre-parsed response body. For JSON responses (based on `Content-Type`), the body is parsed using the `parseJson` option if set, or `JSON.parse` by default. For other content types, it is set as plain text. If the body is empty or parsing fails, `data` will be `undefined`. To avoid hanging or excessive buffering, `error.data` population is bounded by the request timeout and a 10 MiB response body size limit. The `data` property is populated before `beforeError` hooks run, so hooks can access it.

	The response body is automatically consumed when populating `error.data`, so `error.response.json()` and other body methods will not work. Use `error.data` instead. The `error.response` object is still available for headers, status, etc.

	Be aware that some types of errors, such as network errors, inherently mean that a response was not received. In that case, the error will be an instance of `NetworkError` instead of `HTTPError` and will not contain a `response` property.
	*/
  class HTTPError extends KyError {
    name = 'HTTPError'
    response
    request
    options
    data
    constructor (response, request, options) {
      const code =
        response.status || response.status === 0 ? response.status : ''
      const title = response.statusText ?? ''
      const status = `${code} ${title}`.trim()
      const reason = status ? `status code ${status}` : 'an unknown error'
      super(`Request failed with ${reason}: ${request.method} ${request.url}`)
      this.response = response
      this.request = request
      this.options = options
    }
  }

  /**
	Error thrown when a network error occurs during the request (e.g., DNS failure, connection refused, offline). It has a `request` property with the `Request` object. The original error is available via the standard `cause` property.

	Network errors are automatically retried (for retriable methods).

	Note: Network errors are detected using runtime-specific heuristics. Unrecognized runtimes may produce errors that are not wrapped in `NetworkError`. Use the `shouldRetry` option to handle such cases.
	*/
  class NetworkError extends KyError {
    name = 'NetworkError'
    request
    constructor (request, options) {
      super(
        `Request failed due to a network error: ${request.method} ${request.url}`,
        options
      )
      this.request = request
    }
  }

  /**
	Wrapper for non-Error values that were thrown.

	In JavaScript, any value can be thrown (not just Error instances). This class wraps such values to ensure consistent error handling.
	*/
  class NonError extends Error {
    name = 'NonError'
    value
    constructor (value) {
      let message = 'Non-error value was thrown'
      // Intentionally minimal as this error is just an edge-case.
      try {
        if (typeof value === 'string') {
          message = value
        } else if (
          value &&
          typeof value === 'object' &&
          'message' in value &&
          typeof value.message === 'string'
        ) {
          message = value.message
        }
      } catch {
        // Use default message if accessing properties throws
      }
      super(message)
      this.value = value
    }
  }

  /**
	Error used to signal a forced retry from `afterResponse` hooks.

	This is thrown when `ky.retry()` is returned from an `afterResponse` hook. It is observable in `beforeRetry` and `beforeError` hooks via the `isForceRetryError()` type guard.
	*/
  class ForceRetryError extends KyError {
    name = 'ForceRetryError'
    customDelay
    code
    customRequest
    constructor (options) {
      // Runtime protection: wrap non-Error causes in NonError
      // TypeScript type is Error for guidance, but JS users can pass anything
      const cause = options?.cause
        ? options.cause instanceof Error
          ? options.cause
          : new NonError(options.cause)
        : undefined
      super(
        options?.code ? `Forced retry: ${options.code}` : 'Forced retry',
        cause ? { cause } : undefined
      )
      this.customDelay = options?.delay
      this.code = options?.code
      this.customRequest = options?.request
    }
  }

  /**
	The error thrown when [Standard Schema](https://github.com/standard-schema/standard-schema) validation fails in `.json(schema)`. It has an `issues` property with the validation issues from the schema.

	This error intentionally does not extend `KyError` because it does not represent a failure in Ky's HTTP lifecycle. The request succeeded; the user's schema rejected the data. As such, it is not matched by `isKyError()`.

	@example
	```
	import ky, {SchemaValidationError} from 'ky';
	import {z} from 'zod';

	const userSchema = z.object({name: z.string()});

	try {
	    const user = await ky('/api/user').json(userSchema);
	    console.log(user.name);
	} catch (error) {
	    if (error instanceof SchemaValidationError) {
	        console.error(error.issues);
	    }
	}
	```
	*/
  class SchemaValidationError extends Error {
    name = 'SchemaValidationError'
    issues
    constructor (issues) {
      super('Response schema validation failed')
      this.issues = issues
    }
  }

  /**
	Error thrown when the request times out. It has a `request` property with the `Request` object.
	*/
  class TimeoutError extends KyError {
    name = 'TimeoutError'
    request
    constructor (request) {
      super(`Request timed out: ${request.method} ${request.url}`)
      this.request = request
    }
  }

  const supportsRequestStreams = (() => {
    let duplexAccessed = false
    let hasContentType = false
    const supportsReadableStream =
      typeof globalThis.ReadableStream === 'function'
    const supportsRequest = typeof globalThis.Request === 'function'
    if (supportsReadableStream && supportsRequest) {
      try {
        hasContentType = new globalThis.Request('https://empty.invalid', {
          body: new globalThis.ReadableStream(),
          method: 'POST',
          // @ts-expect-error - Types are outdated.
          get duplex () {
            duplexAccessed = true
            return 'half'
          }
        }).headers.has('Content-Type')
      } catch (error) {
        // QQBrowser on iOS throws "unsupported BodyInit type" error (see issue #581)
        if (
          error instanceof Error &&
          error.message === 'unsupported BodyInit type'
        ) {
          return false
        }
        throw error
      }
    }
    return duplexAccessed && !hasContentType
  })()
  const supportsAbortController =
    typeof globalThis.AbortController === 'function'
  const supportsAbortSignal =
    typeof globalThis.AbortSignal === 'function' &&
    typeof globalThis.AbortSignal.any === 'function'
  const supportsResponseStreams =
    typeof globalThis.ReadableStream === 'function'
  const supportsFormData = typeof globalThis.FormData === 'function'
  const requestMethods = ['get', 'post', 'put', 'patch', 'head', 'delete']
  const responseTypes = {
    json: 'application/json',
    text: 'text/*',
    formData: 'multipart/form-data',
    arrayBuffer: '*/*',
    blob: '*/*',
    // Supported in modern Fetch implementations (for example, browsers and recent Node.js/undici).
    // We still feature-check at runtime before exposing the shortcut.
    bytes: '*/*'
  }
  // The maximum value of a 32bit int (see issue #117)
  const maxSafeTimeout = 2_147_483_647
  // Size in bytes of a typical form boundary (e.g., '------WebKitFormBoundaryaxpyiPgbbPti10Rw'), used to help estimate upload size
  const usualFormBoundarySize = 40
  /**
	Symbol that can be returned by a `beforeRetry` hook to stop retrying without throwing an error.
	*/
  const stop = Symbol('stop')
  /**
	Marker returned by `ky.retry()` to signal a forced retry from `afterResponse` hooks.
	*/
  class RetryMarker {
    options
    constructor (options) {
      this.options = options
    }
  }
  /**
	Force a retry from an `afterResponse` hook.

	This allows you to retry a request based on the response content, even if the response has a successful status code. The retry will respect the `retry.limit` option and skip the `shouldRetry` check. The forced retry is observable in `beforeRetry` hooks, where the error will be a `ForceRetryError`.

	@param options - Optional configuration for the retry.

	@example
	```
	import ky, {isForceRetryError} from 'ky';

	const api = ky.extend({
	    hooks: {
	        afterResponse: [
	            async ({request, response}) => {
	                // Retry based on response body content
	                if (response.status === 200) {
	                    const data = await response.json();

	                    // Simple retry with default delay
	                    if (data.error?.code === 'TEMPORARY_ERROR') {
	                        return ky.retry();
	                    }

	                    // Retry with custom delay from API response
	                    if (data.error?.code === 'RATE_LIMIT') {
	                        return ky.retry({
	                            delay: data.error.retryAfter * 1000,
	                            code: 'RATE_LIMIT'
	                        });
	                    }

	                    // Retry with a modified request (e.g., fallback endpoint)
	                    if (data.error?.code === 'FALLBACK_TO_BACKUP') {
	                        return ky.retry({
	                            request: new Request('https://backup-api.com/endpoint', {
	                                method: request.method,
	                                headers: request.headers,
	                            }),
	                            code: 'BACKUP_ENDPOINT'
	                        });
	                    }

	                    // Retry with refreshed authentication
	                    if (data.error?.code === 'TOKEN_REFRESH' && data.newToken) {
	                        return ky.retry({
	                            request: new Request(request, {
	                                headers: {
	                                    ...Object.fromEntries(request.headers),
	                                    'Authorization': `Bearer ${data.newToken}`
	                                }
	                            }),
	                            code: 'TOKEN_REFRESHED'
	                        });
	                    }

	                    // Retry with cause to preserve error chain
	                    try {
	                        validateResponse(data);
	                    } catch (error) {
	                        return ky.retry({
	                            code: 'VALIDATION_FAILED',
	                            cause: error
	                        });
	                    }
	                }
	            }
	        ],
	        beforeRetry: [
	            ({error, retryCount}) => {
	                // Observable in beforeRetry hooks
	                if (isForceRetryError(error)) {
	                    console.log(`Forced retry #${retryCount}: ${error.message}`);
	                    // Example output: "Forced retry #1: Forced retry: RATE_LIMIT"
	                }
	            }
	        ]
	    }
	});

	const response = await api.get('https://example.com/api');
	```
	*/
  const retry = options => new RetryMarker(options)
  const kyOptionKeys = {
    json: true,
    parseJson: true,
    stringifyJson: true,
    searchParams: true,
    baseUrl: true,
    prefix: true,
    retry: true,
    timeout: true,
    totalTimeout: true,
    hooks: true,
    throwHttpErrors: true,
    onDownloadProgress: true,
    onUploadProgress: true,
    fetch: true,
    context: true
  }
  // Standard RequestInit options that should NOT be passed separately to fetch()
  // because they're already applied to the Request object.
  // Note: `dispatcher` and `priority` are NOT included here - they're fetch-only
  // options that the Request constructor doesn't accept, so they need to be passed
  // separately to fetch().
  const requestOptionsRegistry = {
    method: true,
    headers: true,
    body: true,
    mode: true,
    credentials: true,
    cache: true,
    redirect: true,
    referrer: true,
    referrerPolicy: true,
    integrity: true,
    keepalive: true,
    signal: true,
    window: true,
    duplex: true
  }

  const encoder = new TextEncoder()
  // eslint-disable-next-line @typescript-eslint/no-restricted-types
  const getBodySize = body => {
    if (!body) {
      return 0
    }
    if (body instanceof FormData) {
      // This is an approximation, as FormData size calculation is not straightforward
      let size = 0
      for (const [key, value] of body) {
        size += usualFormBoundarySize
        size += encoder.encode(
          `Content-Disposition: form-data; name="${key}"`
        ).byteLength
        size +=
          typeof value === 'string'
            ? encoder.encode(value).byteLength
            : value.size
      }
      return size
    }
    if (body instanceof Blob) {
      return body.size
    }
    if (body instanceof ArrayBuffer || ArrayBuffer.isView(body)) {
      return body.byteLength
    }
    if (typeof body === 'string') {
      return encoder.encode(body).byteLength
    }
    if (body instanceof URLSearchParams) {
      return encoder.encode(body.toString()).byteLength
    }
    return 0
  }
  const withProgress = (stream, totalBytes, onProgress) => {
    let previousChunk
    let transferredBytes = 0
    return stream.pipeThrough(
      new TransformStream({
        transform (currentChunk, controller) {
          controller.enqueue(currentChunk)
          if (previousChunk) {
            transferredBytes += previousChunk.byteLength
            let percent = totalBytes === 0 ? 0 : transferredBytes / totalBytes
            // Avoid reporting 100% progress before the stream is actually finished (in case totalBytes is inaccurate)
            if (percent >= 1) {
              // Epsilon is used here to get as close as possible to 100% without reaching it.
              // If we were to use 0.99 here, percent could potentially go backwards.
              percent = 1 - Number.EPSILON
            }
            onProgress?.(
              {
                percent,
                totalBytes: Math.max(totalBytes, transferredBytes),
                transferredBytes
              },
              previousChunk
            )
          }
          previousChunk = currentChunk
        },
        flush () {
          if (previousChunk) {
            transferredBytes += previousChunk.byteLength
            onProgress?.(
              {
                percent: 1,
                totalBytes: Math.max(totalBytes, transferredBytes),
                transferredBytes
              },
              previousChunk
            )
          }
        }
      })
    )
  }
  const streamResponse = (response, onDownloadProgress) => {
    if (!response.body) {
      return response
    }
    const responseInit = {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    }
    if (response.status === 204) {
      return new Response(null, responseInit)
    }
    const totalBytes = Math.max(
      0,
      Number(response.headers.get('content-length')) || 0
    )
    return new Response(
      withProgress(response.body, totalBytes, onDownloadProgress),
      responseInit
    )
  }
  // eslint-disable-next-line @typescript-eslint/no-restricted-types
  const streamRequest = (request, onUploadProgress, originalBody) => {
    if (!request.body) {
      return request
    }
    // Use original body for size calculation since request.body is already a stream
    const totalBytes = getBodySize(originalBody ?? request.body)
    return new Request(request, {
      // @ts-expect-error - Types are outdated.
      duplex: 'half',
      body: withProgress(request.body, totalBytes, onUploadProgress)
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-restricted-types
  const isObject = value => value !== null && typeof value === 'object'

  const replaceSymbol = Symbol('replaceOption')
  const getReplaceState = value =>
    isObject(value) && value[replaceSymbol] === true
      ? {
        isReplace: true,
        value: value.value
      }
      : {
        isReplace: false,
        value
      }
  /**
	Wraps a value so that `ky.extend()` will replace the parent value instead of merging with it. Works with hooks, headers, search parameters, context, and any other deep-merged option.

	By default, `.extend()` deep-merges options with the parent instance: hooks get appended, headers get merged, and search parameters get accumulated. Use `replaceOption` when you want to fully replace a merged property instead.

	@example
	```
	import ky, {replaceOption} from 'ky';

	const base = ky.create({
	    hooks: {beforeRequest: [addAuth, addTracking]},
	});

	// Replaces instead of appending
	const extended = base.extend({
	    hooks: replaceOption({beforeRequest: [onlyThis]}),
	});
	// hooks.beforeRequest is now [onlyThis], not [addAuth, addTracking, onlyThis]
	```
	*/
  const replaceOption = value => {
    const markedValue = { [replaceSymbol]: true, value }
    return markedValue
  }
  const validateAndMerge = (...sources) => {
    for (const source of sources) {
      if (
        (!isObject(source) || Array.isArray(source)) &&
        source !== undefined
      ) {
        throw new TypeError('The `options` argument must be an object')
      }
    }
    return deepMerge({}, ...sources)
  }
  const mergeHeaders = (source1 = {}, source2 = {}) => {
    const result = new globalThis.Headers(source1)
    const isHeadersInstance = source2 instanceof globalThis.Headers
    const source = new globalThis.Headers(source2)
    for (const [key, value] of source.entries()) {
      if ((isHeadersInstance && value === 'undefined') || value === undefined) {
        result.delete(key)
      } else {
        result.set(key, value)
      }
    }
    return result
  }
  const isPlainObject = value => {
    if (!isObject(value) || Array.isArray(value)) {
      return false
    }
    const prototype = Object.getPrototypeOf(value)
    return prototype === Object.prototype || prototype === null
  }
  const cloneShallow = value => {
    if (value instanceof URLSearchParams) {
      const copy = new URLSearchParams(value)
      const deleted = value[deletedParametersSymbol]
      if (deleted) {
        // Preserve internal deletion markers so init-hook cloning does not resurrect params removed during option merging.
        copy[deletedParametersSymbol] = new Set(deleted)
      }
      return copy
    }
    if (value instanceof globalThis.Headers) {
      return new globalThis.Headers(value)
    }
    if (Array.isArray(value)) {
      return [...value]
    }
    if (isPlainObject(value)) {
      const copy = { ...value }
      return copy
    }
    return value
  }
  const normalizeHeaderObject = headers =>
    Object.fromEntries(
      Object.entries(headers).filter(entry => entry[1] !== undefined)
    )
  const mergeHeaderContainers = (source1, source2) => {
    if (isPlainObject(source1) && isPlainObject(source2)) {
      return normalizeHeaderObject({ ...source1, ...source2 })
    }
    return mergeHeaders(source1, source2)
  }
  function newHookValue (original, incoming, property) {
    return Object.hasOwn(incoming, property) && incoming[property] === undefined
      ? []
      : deepMerge(original[property] ?? [], incoming[property] ?? [])
  }
  const mergeHooks = (original = {}, incoming = {}) => ({
    init: newHookValue(original, incoming, 'init'),
    beforeRequest: newHookValue(original, incoming, 'beforeRequest'),
    beforeRetry: newHookValue(original, incoming, 'beforeRetry'),
    beforeError: newHookValue(original, incoming, 'beforeError'),
    afterResponse: newHookValue(original, incoming, 'afterResponse')
  })
  const deletedParametersSymbol = Symbol('deletedParameters')
  const appendSearchParameters = (target, source) => {
    const result = new URLSearchParams()
    const deleted = new Set()
    for (const input of [target, source]) {
      if (input === undefined) {
        continue
      }
      if (input instanceof URLSearchParams) {
        for (const [key, value] of input.entries()) {
          result.append(key, value)
          deleted.delete(key)
        }
        const inputDeleted = input[deletedParametersSymbol]
        if (inputDeleted) {
          for (const key of inputDeleted) {
            result.delete(key)
            deleted.add(key)
          }
        }
      } else if (Array.isArray(input)) {
        for (const pair of input) {
          if (!Array.isArray(pair) || pair.length !== 2) {
            throw new TypeError(
              'Array search parameters must be provided in [[key, value], ...] format'
            )
          }
          result.append(String(pair[0]), String(pair[1]))
          deleted.delete(String(pair[0]))
        }
      } else if (isObject(input)) {
        for (const [key, value] of Object.entries(input)) {
          if (value === undefined) {
            result.delete(key)
            deleted.add(key)
          } else {
            result.append(key, String(value))
            deleted.delete(key)
          }
        }
      } else {
        // String
        const parameters = new URLSearchParams(input)
        for (const [key, value] of parameters.entries()) {
          result.append(key, value)
          deleted.delete(key)
        }
      }
    }
    if (deleted.size > 0) {
      result[deletedParametersSymbol] = deleted
    }
    return result
  }
  // TODO: Make this strongly-typed (no `any`).
  const deepMerge = (...sources) => {
    let returnValue = {}
    let headers = {}
    let hooks = {}
    let searchParameters
    const signals = []
    for (const source of sources) {
      if (Array.isArray(source)) {
        if (!Array.isArray(returnValue)) {
          returnValue = []
        }
        returnValue = [...returnValue, ...source]
      } else if (isObject(source)) {
        for (let [key, value] of Object.entries(source)) {
          // Special handling for AbortSignal instances
          if (key === 'signal' && value instanceof globalThis.AbortSignal) {
            signals.push(value)
            continue
          }
          const replaceState = getReplaceState(value)
          const { isReplace } = replaceState
          value = replaceState.value
          // Special handling for context - shallow merge only
          if (key === 'context') {
            if (
              value !== undefined &&
              value !== null &&
              (!isObject(value) || Array.isArray(value))
            ) {
              throw new TypeError('The `context` option must be an object')
            }
            // Shallow merge: always create a new object to prevent mutation bugs
            returnValue = {
              ...returnValue,
              context:
                value === undefined || value === null
                  ? {}
                  : isReplace
                    ? { ...value }
                    : { ...returnValue.context, ...value }
            }
            continue
          }
          // Special handling for searchParams
          if (key === 'searchParams') {
            if (value === undefined || value === null) {
              // Explicit undefined or null removes searchParams
              searchParameters = undefined
            } else if (isReplace) {
              searchParameters = value
            } else {
              // First source: keep as-is to preserve type (string/object/URLSearchParams)
              // Subsequent sources: merge and convert to URLSearchParams
              searchParameters =
                searchParameters === undefined
                  ? value
                  : appendSearchParameters(searchParameters, value)
            }
            continue
          }
          if (isObject(value) && !isReplace && key in returnValue) {
            value = deepMerge(returnValue[key], value)
          }
          returnValue = { ...returnValue, [key]: value }
        }
        if (isObject(source.hooks)) {
          const { value: hookValue, isReplace } = getReplaceState(source.hooks)
          hooks = isReplace
            ? mergeHooks({}, hookValue)
            : mergeHooks(hooks, hookValue)
          returnValue.hooks = hooks
        }
        if (isObject(source.headers)) {
          const { value: headerValue, isReplace } = getReplaceState(
            source.headers
          )
          headers = isReplace
            ? cloneShallow(headerValue)
            : mergeHeaderContainers(headers, headerValue)
          returnValue.headers = headers
        }
      }
    }
    if (searchParameters !== undefined) {
      returnValue.searchParams = searchParameters
    }
    if (signals.length > 0) {
      if (signals.length === 1) {
        returnValue.signal = signals[0]
      } else if (supportsAbortSignal) {
        returnValue.signal = AbortSignal.any(signals)
      } else {
        // When AbortSignal.any is not available, use the last signal
        // This maintains the previous behavior before signal merging was added
        // This can be remove when the `supportsAbortSignal` check is removed.`
        returnValue.signal = signals.at(-1)
      }
    }
    return returnValue
  }

  const normalizeRequestMethod = input =>
    requestMethods.includes(input) ? input.toUpperCase() : input
  const retryMethods = ['get', 'put', 'head', 'delete', 'options', 'trace']
  const retryStatusCodes = [408, 413, 429, 500, 502, 503, 504]
  const retryAfterStatusCodes = [413, 429, 503]
  const defaultRetryOptions = {
    limit: 2,
    methods: retryMethods,
    statusCodes: retryStatusCodes,
    afterStatusCodes: retryAfterStatusCodes,
    maxRetryAfter: Number.POSITIVE_INFINITY,
    backoffLimit: Number.POSITIVE_INFINITY,
    delay: attemptCount => 0.3 * 2 ** (attemptCount - 1) * 1000,
    jitter: undefined,
    retryOnTimeout: false
  }
  const normalizeRetryOptions = (retry = {}) => {
    if (typeof retry === 'number') {
      return {
        ...defaultRetryOptions,
        limit: retry
      }
    }
    if (retry.methods && !Array.isArray(retry.methods)) {
      throw new Error('retry.methods must be an array')
    }
    if (retry.statusCodes && !Array.isArray(retry.statusCodes)) {
      throw new Error('retry.statusCodes must be an array')
    }
    const normalizedRetry = Object.fromEntries(
      Object.entries({
        ...retry,
        methods: retry.methods?.map(method => method.toLowerCase())
      }).filter(([, value]) => value !== undefined)
    )
    return {
      ...defaultRetryOptions,
      ...normalizedRetry
    }
  }

  // `Promise.race()` workaround (#91)
  async function timeout (request, init, abortController, options) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        if (abortController) {
          abortController.abort()
        }
        reject(new TimeoutError(request))
      }, options.timeout)
      void options
        .fetch(request, init)
        .then(resolve)
        .catch(reject)
        .then(() => {
          clearTimeout(timeoutId)
        })
    })
  }

  // https://github.com/sindresorhus/delay/tree/ab98ae8dfcb38e1593286c94d934e70d14a4e111
  async function delay (ms, { signal }) {
    return new Promise((resolve, reject) => {
      if (signal) {
        signal.throwIfAborted()
        signal.addEventListener('abort', abortHandler, { once: true })
      }
      function abortHandler () {
        clearTimeout(timeoutId)
        reject(signal.reason)
      }
      const timeoutId = setTimeout(() => {
        signal?.removeEventListener('abort', abortHandler)
        resolve()
      }, ms)
    })
  }

  const findUnknownOptions = options => {
    const unknownOptions = {}
    for (const key in options) {
      // Skip inherited properties
      if (!Object.hasOwn(options, key)) {
        continue
      }
      // Forward every non-standard, non-Ky option to fetch().
      // We intentionally do not check whether the key also exists on `Request`, because some runtimes
      // patch `Request.prototype` with fetch-only extensions. For example, Next.js adds `next`, and the
      // old `key in request` heuristic dropped it unless Ky kept a special-case allowlist.
      // Passing all non-standard keys makes that allowlist unnecessary and preserves future fetch extensions too.
      if (!(key in requestOptionsRegistry) && !(key in kyOptionKeys)) {
        unknownOptions[key] = options[key]
      }
    }
    return unknownOptions
  }
  const hasSearchParameters = search => {
    if (search === undefined) {
      return false
    }
    // The `typeof array` still gives "object", so we need different checking for array.
    if (Array.isArray(search)) {
      return search.length > 0
    }
    if (search instanceof URLSearchParams) {
      return search.size > 0 || Boolean(search[deletedParametersSymbol]?.size)
    }
    // Record
    if (typeof search === 'object') {
      return Object.keys(search).length > 0
    }
    if (typeof search === 'string') {
      return search.trim().length > 0
    }
    return Boolean(search)
  }

  // Inlined from https://github.com/sindresorhus/is-network-error v1.3.1
  const objectToString$1 = Object.prototype.toString
  const isError = value => objectToString$1.call(value) === '[object Error]'
  const errorMessages = new Set([
    'network error', // Chrome
    'NetworkError when attempting to fetch resource.', // Firefox
    'The Internet connection appears to be offline.', // Safari 16
    'Network request failed', // `cross-fetch`
    'fetch failed', // Undici (Node.js)
    'terminated', // Undici (Node.js)
    ' A network error occurred.', // Bun (WebKit) - leading space is intentional
    'Network connection lost' // Cloudflare Workers (fetch)
  ])
  function isRawNetworkError (error) {
    const isValid =
      error &&
      isError(error) &&
      error.name === 'TypeError' &&
      typeof error.message === 'string'
    if (!isValid) {
      return false
    }
    const { message, stack } = error
    // Safari 17+ has generic message but no stack for network errors
    if (message === 'Load failed') {
      return (
        stack === undefined ||
        // Sentry adds its own stack trace to the fetch error, so also check for that
        '__sentry_captured__' in error
      )
    }
    // Deno network errors start with specific text
    if (message.startsWith('error sending request for url')) {
      return true
    }
    // Chrome: exact "Failed to fetch" or with hostname: "Failed to fetch (example.com)"
    if (
      message === 'Failed to fetch' ||
      (message.startsWith('Failed to fetch (') && message.endsWith(')'))
    ) {
      return true
    }
    // Standard network error messages
    return errorMessages.has(message)
  }

  // Handles cross-realm cases (e.g., iframes, different JS contexts) where `instanceof` fails.
  const isErrorType = (error, cls) =>
    error instanceof cls || error?.name === cls.name
  /**
	Type guard to check if an error is a `KyError`.

	Note: `SchemaValidationError` is intentionally not considered a Ky error. `KyError` covers failures in Ky's HTTP lifecycle (bad status, timeout, retry), while schema validation errors originate from the user-provided schema, not from Ky itself.

	@param error - The error to check
	@returns `true` if the error is a Ky error, `false` otherwise

	@example
	```
	import ky, {isKyError} from 'ky';
	try {
	    const response = await ky.get('/api/data');
	} catch (error) {
	    if (isKyError(error)) {
	        // Handle Ky-specific errors
	        console.log('Ky error occurred:', error.message);
	    } else {
	        // Handle other errors
	        console.log('Unknown error:', error);
	    }
	}
	```
	*/
  function isKyError (error) {
    return (
      error?.isKyError === true ||
      isHTTPError(error) ||
      isNetworkError(error) ||
      isTimeoutError(error) ||
      isForceRetryError(error)
    )
  }
  /**
	Type guard to check if an error is an `HTTPError`.

	@param error - The error to check
	@returns `true` if the error is an `HTTPError`, `false` otherwise

	@example
	```
	import ky, {isHTTPError} from 'ky';
	try {
	    const response = await ky.get('/api/data');
	} catch (error) {
	    if (isHTTPError(error)) {
	        console.log('HTTP error status:', error.response.status);
	    }
	}
	```
	*/
  function isHTTPError (error) {
    return isErrorType(error, HTTPError)
  }
  /**
	Type guard to check if an error is a `NetworkError`.

	@param error - The error to check
	@returns `true` if the error is a `NetworkError`, `false` otherwise

	@example
	```
	import ky, {isNetworkError} from 'ky';
	try {
	    const response = await ky.get('/api/data');
	} catch (error) {
	    if (isNetworkError(error)) {
	        console.log('Network error:', error.request.url);
	    }
	}
	```
	*/
  function isNetworkError (error) {
    return isErrorType(error, NetworkError)
  }
  /**
	Type guard to check if an error is a `TimeoutError`.

	@param error - The error to check
	@returns `true` if the error is a `TimeoutError`, `false` otherwise

	@example
	```
	import ky, {isTimeoutError} from 'ky';
	try {
	    const response = await ky.get('/api/data', { timeout: 1000 });
	} catch (error) {
	    if (isTimeoutError(error)) {
	        console.log('Request timed out:', error.request.url);
	    }
	}
	```
	*/
  function isTimeoutError (error) {
    return isErrorType(error, TimeoutError)
  }
  /**
	Type guard to check if an error is a `ForceRetryError`.

	@param error - The error to check
	@returns `true` if the error is a `ForceRetryError`, `false` otherwise

	@example
	```
	import ky, {isForceRetryError} from 'ky';

	const api = ky.extend({
	    hooks: {
	        beforeRetry: [
	            ({error, retryCount}) => {
	                if (isForceRetryError(error)) {
	                    console.log(`Forced retry #${retryCount}: ${error.code}`);
	                }
	            }
	        ]
	    }
	});
	```
	*/
  function isForceRetryError (error) {
    return isErrorType(error, ForceRetryError)
  }

  const maxErrorResponseBodySize = 10 * 1024 * 1024
  const prefixUrlRenamedErrorMessage =
    'The `prefixUrl` option has been renamed `prefix` in v2 and enhanced to allow slashes in input. See also the new `baseUrl` option for improved flexibility with standard URL resolution: https://github.com/sindresorhus/ky#baseurl'
  const timedOutResponseData = Symbol('timedOutResponseData')
  const createTextDecoder = contentType => {
    const match = /;\s*charset\s*=\s*(?:"([^"]+)"|([^;,\s]+))/i.exec(
      contentType
    )
    const charset = match?.[1] ?? match?.[2]
    if (charset) {
      try {
        return new TextDecoder(charset)
      } catch {}
    }
    return new TextDecoder()
  }
  const invalidSchemaMessage =
    'The `schema` argument must follow the Standard Schema specification'
  const cloneRetryOptions = retry => {
    if (typeof retry !== 'object') {
      return retry
    }
    // Clone nested arrays too so init hooks can mutate retry config without leaking state across requests.
    return {
      ...retry,
      ...(retry.methods && { methods: [...retry.methods] }),
      ...(retry.statusCodes && { statusCodes: [...retry.statusCodes] }),
      ...(retry.afterStatusCodes && {
        afterStatusCodes: [...retry.afterStatusCodes]
      })
    }
  }
  const objectToString = Object.prototype.toString
  const isRequestInstance = value =>
    value instanceof globalThis.Request ||
    objectToString.call(value) === '[object Request]'
  // Accepted custom responses are treated as full Responses throughout Ky.
  // If a custom fetch returns one, it must behave like a Response for cloning,
  // body consumption, `json()` decoration, and any enabled stream features.
  const isResponseInstance = value =>
    value instanceof globalThis.Response ||
    objectToString.call(value) === '[object Response]'
  const cloneSearchParametersForInitHook = searchParameters => {
    if (Array.isArray(searchParameters)) {
      return searchParameters.map(parameter => [...parameter])
    }
    return cloneShallow(searchParameters)
  }
  // Shallow-clone mutable option properties so init hook mutations don't leak across requests.
  function cloneInitHookOptions (options) {
    const clonedOptions = {
      ...options,
      json: cloneShallow(options.json),
      context: cloneShallow(options.context),
      headers: cloneShallow(options.headers),
      searchParams: cloneSearchParametersForInitHook(options.searchParams)
    }
    if (options.retry !== undefined) {
      clonedOptions.retry = cloneRetryOptions(options.retry)
    }
    return clonedOptions
  }
  const validateJsonWithSchema = async (jsonValue, schema) => {
    if (
      (typeof schema !== 'object' && typeof schema !== 'function') ||
      schema === null
    ) {
      throw new TypeError(invalidSchemaMessage)
    }
    const standardSchema = schema['~standard']
    if (
      typeof standardSchema !== 'object' ||
      standardSchema === null ||
      typeof standardSchema.validate !== 'function'
    ) {
      throw new TypeError(invalidSchemaMessage)
    }
    const validationResult = await standardSchema.validate(jsonValue)
    if (validationResult.issues) {
      throw new SchemaValidationError(validationResult.issues)
    }
    return validationResult.value
  }
  class Ky {
    static create (input, options) {
      const initHooks = options.hooks?.init ?? []
      const initHookOptions =
        initHooks.length > 0 ? cloneInitHookOptions(options) : options
      for (const hook of initHooks) {
        hook(initHookOptions)
      }
      const ky = new Ky(input, initHookOptions)
      const function_ = async () => {
        if (
          typeof ky.#options.timeout === 'number' &&
          ky.#options.timeout > maxSafeTimeout
        ) {
          throw new RangeError(
            `The \`timeout\` option cannot be greater than ${maxSafeTimeout}`
          )
        }
        if (
          typeof ky.#options.totalTimeout === 'number' &&
          ky.#options.totalTimeout > maxSafeTimeout
        ) {
          throw new RangeError(
            `The \`totalTimeout\` option cannot be greater than ${maxSafeTimeout}`
          )
        }
        // Delay the fetch so that body method shortcuts can set the Accept header
        await Promise.resolve()
        const beforeRequestResponse = await ky.#runBeforeRequestHooks()
        let response =
          beforeRequestResponse ?? (await ky.#retry(async () => ky.#fetch()))
        let responseFromHook =
          beforeRequestResponse !== undefined ||
          ky.#consumeReturnedResponseFromBeforeRetryHook()
        for (;;) {
          // `undefined` means a hook stopped the flow without providing a response.
          // Non-native Responses still continue through Ky if they pass `isResponseInstance()`.
          if (response === undefined) {
            return response
          }
          if (isResponseInstance(response)) {
            try {
              // eslint-disable-next-line no-await-in-loop
              response = await ky.#runAfterResponseHooks(response)
            } catch (error) {
              if (!(error instanceof ForceRetryError)) {
                throw error
              }
              // eslint-disable-next-line no-await-in-loop
              const retriedResponse = await ky.#retryFromError(
                error,
                async () => ky.#fetch()
              )
              if (retriedResponse === undefined) {
                return retriedResponse
              }
              response = retriedResponse
              responseFromHook =
                ky.#consumeReturnedResponseFromBeforeRetryHook()
              continue
            }
          }
          const currentResponse = response
          // Opaque responses (`response.type === 'opaque'`) from `no-cors` requests always have `status: 0` and `ok: false`, but this is not a failure - the actual status is hidden by the browser.
          if (
            !currentResponse.ok &&
            currentResponse.type !== 'opaque' &&
            (typeof ky.#options.throwHttpErrors === 'function'
              ? ky.#options.throwHttpErrors(currentResponse.status)
              : ky.#options.throwHttpErrors)
          ) {
            // `request` must reflect the request that actually failed, but `options` stays as Ky's
            // normalized options snapshot. Replacement `Request` instances do not preserve the
            // original `BodyInit`, so trying to make `options` mirror arbitrary requests would be lossy.
            const httpError = new HTTPError(
              currentResponse,
              ky.#getResponseRequest(currentResponse),
              ky.#getNormalizedOptions()
            )
            const errorToThrow = httpError
            // eslint-disable-next-line no-await-in-loop
            httpError.data = await ky.#getResponseData(currentResponse)
            if (responseFromHook) {
              throw errorToThrow
            }
            // eslint-disable-next-line no-await-in-loop
            const retriedResponse = await ky.#retryFromError(
              httpError,
              async () => ky.#fetch()
            )
            if (retriedResponse === undefined) {
              return retriedResponse
            }
            response = retriedResponse
            responseFromHook = ky.#consumeReturnedResponseFromBeforeRetryHook()
            continue
          }
          break
        }
        if (!isResponseInstance(response)) {
          return response
        }
        ky.#decorateResponse(response)
        // If `onDownloadProgress` is passed, it uses the stream API internally
        if (ky.#options.onDownloadProgress) {
          if (typeof ky.#options.onDownloadProgress !== 'function') {
            throw new TypeError(
              'The `onDownloadProgress` option must be a function'
            )
          }
          if (!supportsResponseStreams) {
            throw new Error(
              'Streams are not supported in your environment. `ReadableStream` is missing.'
            )
          }
          const progressResponse = response.clone()
          ky.#cancelResponseBody(response)
          return streamResponse(
            progressResponse,
            ky.#options.onDownloadProgress
          )
        }
        return response
      }
      const result = (async () => {
        try {
          return await function_()
        } catch (error) {
          // Non-Error throws (e.g., thrown strings) pass through unchanged
          if (!(error instanceof Error)) {
            throw error
          }
          // Errors thrown by beforeRetry hooks must propagate unchanged.
          if (ky.#beforeRetryHookErrors.has(error)) {
            throw error
          }
          let processedError = error
          for (const hook of ky.#options.hooks.beforeError) {
            // `request` is the current failing request. `options` intentionally remains the
            // stable normalized Ky options snapshot for the same reason as `HTTPError` above.
            // eslint-disable-next-line no-await-in-loop
            const hookResult = await hook({
              request: ky.request,
              options: ky.#getNormalizedOptions(),
              error: processedError,
              retryCount: ky.#retryCount
            })
            // Only overwrite if the hook returns a valid Error instance.
            if (hookResult instanceof Error) {
              processedError = hookResult
            }
          }
          throw processedError
        } finally {
          const originalRequest = ky.#originalRequest
          // Ignore cancellation errors from already-locked or already-consumed streams.
          ky.#cancelBody(originalRequest?.body ?? undefined)
          // Only cancel the current request body if it's distinct from the original (i.e. it was cloned for retries).
          if (ky.request !== originalRequest) {
            ky.#cancelBody(ky.request.body ?? undefined)
          }
        }
      })()
      for (const [type, mimeType] of Object.entries(responseTypes)) {
        // Only expose `.bytes()` when the environment implements it.
        if (
          type === 'bytes' &&
          typeof globalThis.Response?.prototype?.bytes !== 'function'
        ) {
          continue
        }
        result[type] = async schema => {
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          ky.request.headers.set(
            'accept',
            ky.request.headers.get('accept') || mimeType
          )
          const response = await result
          if (type !== 'json') {
            return response[type]()
          }
          const text = await response.text()
          if (text === '') {
            if (schema !== undefined) {
              return validateJsonWithSchema(undefined, schema)
            }
            return JSON.parse(text)
          }
          const jsonValue = initHookOptions.parseJson
            ? await initHookOptions.parseJson(text, {
              request: ky.#getResponseRequest(response),
              response
            })
            : JSON.parse(text)
          return schema === undefined
            ? jsonValue
            : validateJsonWithSchema(jsonValue, schema)
        }
      }
      return result
    }
    // eslint-disable-next-line unicorn/prevent-abbreviations
    static #normalizeSearchParams (searchParams) {
      // Filter out undefined values from plain objects
      if (
        searchParams &&
        typeof searchParams === 'object' &&
        !Array.isArray(searchParams) &&
        !(searchParams instanceof URLSearchParams)
      ) {
        return Object.fromEntries(
          Object.entries(searchParams).filter(
            ([, value]) => value !== undefined
          )
        )
      }
      return searchParams
    }
    request
    #abortController
    #retryCount = 0
    // eslint-disable-next-line @typescript-eslint/prefer-readonly -- False positive: #input is reassigned on line 202
    #input
    #options
    #originalRequest
    #userProvidedAbortSignal
    #beforeRetryHookErrors = new WeakSet()
    #cachedNormalizedOptions
    #startTime
    #returnedResponseFromBeforeRetryHook = false
    #responseRequests = new WeakMap()
    // eslint-disable-next-line complexity
    constructor (input, options = {}) {
      this.#input = input
      if (Object.hasOwn(options, 'prefixUrl')) {
        throw new Error(prefixUrlRenamedErrorMessage)
      }
      this.#options = {
        ...options,
        headers: mergeHeaders(this.#input.headers, options.headers),
        hooks: mergeHooks({}, options.hooks),
        method: normalizeRequestMethod(
          options.method ?? this.#input.method ?? 'GET'
        ),
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        prefix: String(options.prefix || ''),
        retry: normalizeRetryOptions(options.retry),
        throwHttpErrors: options.throwHttpErrors ?? true,
        timeout: options.timeout ?? 10_000,
        totalTimeout: options.totalTimeout ?? false,
        fetch: options.fetch ?? globalThis.fetch.bind(globalThis),
        context: options.context ?? {}
      }
      if (
        typeof this.#input !== 'string' &&
        !(
          this.#input instanceof URL ||
          this.#input instanceof globalThis.Request
        )
      ) {
        throw new TypeError('`input` must be a string, URL, or Request')
      }
      if (typeof this.#input === 'string') {
        if (this.#options.prefix) {
          const normalizedPrefix = this.#options.prefix.replace(/\/+$/, '')
          const normalizedInput = this.#input.replace(/^\/+/, '')
          this.#input = `${normalizedPrefix}/${normalizedInput}`
        }
        if (this.#options.baseUrl) {
          let absoluteInput
          try {
            absoluteInput = new URL(this.#input)
          } catch {}
          if (!absoluteInput) {
            this.#input = new URL(
              this.#input,
              new Request(this.#options.baseUrl).url
            )
          }
        }
      }
      if (supportsAbortController && supportsAbortSignal) {
        this.#userProvidedAbortSignal =
          this.#options.signal ?? this.#input.signal
        this.#abortController = new globalThis.AbortController()
        this.#options.signal = this.#createManagedSignal()
      }
      if (supportsRequestStreams) {
        // @ts-expect-error - Types are outdated.
        this.#options.duplex = 'half'
      }
      if (this.#options.json !== undefined) {
        this.#options.body =
          this.#options.stringifyJson?.(this.#options.json) ??
          JSON.stringify(this.#options.json)
        this.#options.headers.set(
          'content-type',
          this.#options.headers.get('content-type') ?? 'application/json'
        )
      }
      // To provide correct form boundary, Content-Type header should be deleted when creating Request from another Request with FormData/URLSearchParams body
      // Only delete if user didn't explicitly provide a custom content-type
      const userProvidedContentType =
        options.headers &&
        new globalThis.Headers(options.headers).has('content-type')
      if (
        this.#input instanceof globalThis.Request &&
        ((supportsFormData &&
          this.#options.body instanceof globalThis.FormData) ||
          this.#options.body instanceof URLSearchParams) &&
        !userProvidedContentType
      ) {
        this.#options.headers.delete('content-type')
      }
      this.request = new globalThis.Request(this.#input, this.#options)
      if (hasSearchParameters(this.#options.searchParams)) {
        const url = new URL(this.request.url)
        const deleted = this.#options.searchParams?.[deletedParametersSymbol]
        if (deleted) {
          // Remove keys from the input URL first so later searchParams entries can intentionally re-add them.
          for (const key of deleted) {
            url.searchParams.delete(key)
          }
        }
        if (typeof this.#options.searchParams === 'string') {
          const stringSearchParameters = this.#options.searchParams.replace(
            /^\?/,
            ''
          )
          if (stringSearchParameters !== '') {
            url.search = url.search
              ? `${url.search}&${stringSearchParameters}`
              : `?${stringSearchParameters}`
          }
        } else {
          const optionsSearchParameters = new URLSearchParams(
            Ky.#normalizeSearchParams(this.#options.searchParams)
          )
          for (const [key, value] of optionsSearchParameters.entries()) {
            url.searchParams.append(key, value)
          }
        }
        if (
          this.#options.searchParams &&
          typeof this.#options.searchParams === 'object' &&
          !Array.isArray(this.#options.searchParams) &&
          !(this.#options.searchParams instanceof URLSearchParams)
        ) {
          for (const [key, value] of Object.entries(
            this.#options.searchParams
          )) {
            if (value === undefined) {
              url.searchParams.delete(key)
            }
          }
        }
        // Recreate request with the updated URL. We already have all options in this.#options, including duplex.
        this.request = new globalThis.Request(url, this.#options)
      }
      if (
        this.#options.onUploadProgress &&
        typeof this.#options.onUploadProgress !== 'function'
      ) {
        throw new TypeError('The `onUploadProgress` option must be a function')
      }
      // `totalTimeout` starts when the request pipeline is created, so it also includes
      // Ky's internal scheduling and user hook time before the first fetch attempt.
      this.#startTime =
        typeof this.#options.totalTimeout === 'number'
          ? this.#getCurrentTime()
          : undefined
    }
    #calculateDelay () {
      const retryDelay = this.#options.retry.delay(this.#retryCount + 1)
      let jitteredDelay = retryDelay
      if (this.#options.retry.jitter === true) {
        jitteredDelay = Math.random() * retryDelay
      } else if (typeof this.#options.retry.jitter === 'function') {
        jitteredDelay = this.#options.retry.jitter(retryDelay)
        if (!Number.isFinite(jitteredDelay) || jitteredDelay < 0) {
          jitteredDelay = retryDelay
        }
      }
      return Math.min(this.#options.retry.backoffLimit, jitteredDelay)
    }
    async #calculateRetryDelay (error) {
      if (this.#retryCount >= this.#options.retry.limit) {
        throw error
      }
      // Wrap non-Error throws to ensure consistent error handling
      const errorObject = error instanceof Error ? error : new NonError(error)
      // Handle forced retry from afterResponse hook - skip method check and shouldRetry
      if (errorObject instanceof ForceRetryError) {
        return errorObject.customDelay ?? this.#calculateDelay()
      }
      // Check if method is retriable for non-forced retries
      if (
        !this.#options.retry.methods.includes(this.request.method.toLowerCase())
      ) {
        throw error
      }
      // User-provided shouldRetry function takes precedence over default checks (retryOnTimeout, status codes, etc.)
      if (this.#options.retry.shouldRetry !== undefined) {
        const result = await this.#options.retry.shouldRetry({
          error: errorObject,
          retryCount: this.#retryCount + 1
        })
        // Strict boolean checking - only exact true/false are handled specially
        if (result === false) {
          throw error
        }
        if (result === true) {
          // Force retry - skip all other validation and return delay
          return this.#calculateDelay()
        }
        // If undefined or any other value, fall through to default behavior
      }
      // Default timeout behavior
      if (isTimeoutError(error)) {
        if (!this.#options.retry.retryOnTimeout) {
          throw error
        }
        return this.#calculateDelay()
      }
      if (isHTTPError(error)) {
        if (!this.#options.retry.statusCodes.includes(error.response.status)) {
          throw error
        }
        const retryAfter =
          error.response.headers.get('Retry-After') ??
          error.response.headers.get('RateLimit-Reset') ??
          error.response.headers.get('X-RateLimit-Retry-After') ?? // Symfony-based services
          error.response.headers.get('X-RateLimit-Reset') ?? // GitHub
          error.response.headers.get('X-Rate-Limit-Reset') // Twitter
        if (
          retryAfter &&
          this.#options.retry.afterStatusCodes.includes(error.response.status)
        ) {
          let after = Number(retryAfter) * 1000
          if (Number.isNaN(after)) {
            after = Date.parse(retryAfter) - Date.now()
          } else if (after >= Date.parse('2024-01-01')) {
            // A large number is treated as a timestamp (fixed threshold protects against clock skew)
            after -= Date.now()
          }
          if (!Number.isFinite(after)) {
            return Math.min(
              this.#options.retry.maxRetryAfter,
              this.#calculateDelay()
            )
          }
          after = Math.max(0, after)
          // Don't apply jitter when server provides explicit retry timing
          return Math.min(this.#options.retry.maxRetryAfter, after)
        }
        if (error.response.status === 413) {
          throw error
        }
        return this.#calculateDelay()
      }
      // Only retry known retriable error types. Unknown errors (e.g., programming bugs) are not retried.
      if (!isNetworkError(error)) {
        throw error
      }
      return this.#calculateDelay()
    }
    #decorateResponse (response) {
      const request = this.#getResponseRequest(response)
      if (this.#options.parseJson) {
        response.json = async () => {
          const text = await response.text()
          if (text === '') {
            return JSON.parse(text)
          }
          return this.#options.parseJson(text, { request, response })
        }
      }
      return response
    }
    async #getResponseData (response) {
      // Even with request timeouts disabled, bound error-body reads so retries and error propagation
      // cannot be stalled indefinitely by never-ending response streams.
      const text = await this.#readResponseText(
        response,
        this.#getErrorDataTimeout()
      )
      if (text === timedOutResponseData) {
        this.#throwIfTotalTimeoutExhausted()
        return undefined
      }
      if (!text) {
        return undefined
      }
      if (
        !this.#isJsonContentType(response.headers.get('content-type') ?? '')
      ) {
        return text
      }
      const data = await this.#parseJson(
        text,
        response,
        this.#getErrorDataTimeout(),
        this.#getResponseRequest(response)
      )
      if (data === timedOutResponseData) {
        this.#throwIfTotalTimeoutExhausted()
        return undefined
      }
      return data
    }
    #getErrorDataTimeout () {
      const errorDataTimeout =
        this.#options.timeout === false ? 10_000 : this.#options.timeout
      const remainingTotal = this.#getRemainingTotalTimeout()
      if (remainingTotal === undefined) {
        return errorDataTimeout
      }
      if (remainingTotal <= 0) {
        throw new TimeoutError(this.request)
      }
      return Math.min(errorDataTimeout, remainingTotal)
    }
    #isJsonContentType (contentType) {
      // Match JSON subtypes like `json`, `problem+json`, and `vnd.api+json`.
      const mimeType = (contentType.split(';', 1)[0] ?? '').trim().toLowerCase()
      return /\/(?:.*[.+-])?json$/.test(mimeType)
    }
    async #readResponseText (response, timeoutMs) {
      const { body } = response
      if (!body) {
        try {
          return await response.text()
        } catch {
          return undefined
        }
      }
      let reader
      try {
        reader = body.getReader()
      } catch {
        // Another consumer already locked the stream.
        return undefined
      }
      const decoder = createTextDecoder(
        response.headers.get('content-type') ?? ''
      )
      const chunks = []
      let totalBytes = 0
      const readAll = (async () => {
        try {
          for (;;) {
            // eslint-disable-next-line no-await-in-loop
            const { done, value } = await reader.read()
            if (done) {
              break
            }
            totalBytes += value.byteLength
            if (totalBytes > maxErrorResponseBodySize) {
              void reader.cancel().catch(() => undefined)
              return undefined
            }
            chunks.push(decoder.decode(value, { stream: true }))
          }
        } catch {
          return undefined
        }
        chunks.push(decoder.decode())
        return chunks.join('')
      })()
      const timeoutPromise = new Promise(resolve => {
        const timeoutId = setTimeout(() => {
          resolve(timedOutResponseData)
        }, timeoutMs)
        void readAll.finally(() => {
          clearTimeout(timeoutId)
        })
      })
      const result = await Promise.race([readAll, timeoutPromise])
      if (result === timedOutResponseData) {
        void reader.cancel().catch(() => undefined)
      }
      return result
    }
    async #parseJson (text, response, timeoutMs, request) {
      let timeoutId
      try {
        return await Promise.race([
          Promise.resolve().then(() =>
            this.#options.parseJson
              ? this.#options.parseJson(text, { request, response })
              : JSON.parse(text)
          ),
          new Promise(resolve => {
            timeoutId = setTimeout(() => {
              resolve(timedOutResponseData)
            }, timeoutMs)
          })
        ])
      } catch {
        return undefined
      } finally {
        clearTimeout(timeoutId)
      }
    }
    #cancelBody (body) {
      if (!body) {
        return
      }
      // Ignore cancellation failures from already-locked or already-consumed streams.
      void body.cancel().catch(() => undefined)
    }
    #cancelResponseBody (response) {
      // Ignore cancellation failures from already-locked or already-consumed streams.
      this.#cancelBody(response.body ?? undefined)
    }
    #createManagedSignal () {
      return this.#userProvidedAbortSignal
        ? AbortSignal.any([
          this.#userProvidedAbortSignal,
          this.#abortController.signal
        ])
        : this.#abortController.signal
    }
    #throwIfTotalTimeoutExhausted () {
      const remaining = this.#getRemainingTotalTimeout()
      if (remaining !== undefined && remaining <= 0) {
        throw new TimeoutError(this.request)
      }
    }
    async #runBeforeRequestHooks () {
      for (const hook of this.#options.hooks.beforeRequest) {
        // eslint-disable-next-line no-await-in-loop
        const result = await hook({
          request: this.request,
          options: this.#getNormalizedOptions(),
          retryCount: 0
        })
        if (isRequestInstance(result)) {
          this.#assignRequest(result)
        } else if (isResponseInstance(result)) {
          return result
        }
      }
      return undefined
    }
    async #runAfterResponseHooks (response) {
      const responseRequest = this.#getResponseRequest(response)
      for (const hook of this.#options.hooks.afterResponse) {
        const hookResponse = this.#setResponseRequest(
          response.clone(),
          responseRequest
        )
        this.#decorateResponse(hookResponse)
        let modifiedResponse
        try {
          // eslint-disable-next-line no-await-in-loop
          modifiedResponse = await hook({
            request: this.request,
            options: this.#getNormalizedOptions(),
            response: hookResponse,
            retryCount: this.#retryCount
          })
        } catch (error) {
          // Cancel both responses to prevent memory leaks when hook throws
          if (hookResponse !== response) {
            this.#cancelResponseBody(hookResponse)
          }
          this.#cancelResponseBody(response)
          throw error
        }
        if (modifiedResponse instanceof RetryMarker) {
          // Cancel both the cloned response passed to the hook and the current response to prevent resource leaks (especially important in Deno/Bun).
          // Do not await cancellation since hooks can clone the response, leaving extra tee branches that keep cancel promises pending per the Streams spec.
          if (hookResponse !== response) {
            this.#cancelResponseBody(hookResponse)
          }
          this.#cancelResponseBody(response)
          throw new ForceRetryError(modifiedResponse.options)
        }
        const nextResponse = isResponseInstance(modifiedResponse)
          ? this.#setResponseRequest(modifiedResponse, responseRequest)
          : response
        // Cancel any response bodies we won't use to prevent memory leaks.
        // Uses fire-and-forget since hooks may have cloned the response, creating tee branches that block cancellation.
        // If the hook wrapped an existing body into a new Response, both Response objects can still point at the same stream.
        if (
          hookResponse !== response &&
          hookResponse !== nextResponse &&
          hookResponse.body !== nextResponse.body
        ) {
          this.#cancelResponseBody(hookResponse)
        }
        if (response !== nextResponse && response.body !== nextResponse.body) {
          this.#cancelResponseBody(response)
        }
        response = nextResponse
      }
      return response
    }
    async #retry (function_) {
      try {
        return await function_()
      } catch (error) {
        return this.#retryFromError(error, function_)
      }
    }
    async #retryFromError (error, function_) {
      this.#returnedResponseFromBeforeRetryHook = false
      const retryDelay = Math.min(
        await this.#calculateRetryDelay(error),
        maxSafeTimeout
      )
      const delayOptions = { signal: this.#userProvidedAbortSignal }
      const remainingTimeout = this.#getRemainingTotalTimeout()
      if (remainingTimeout !== undefined) {
        if (remainingTimeout <= 0) {
          throw new TimeoutError(this.request)
        }
        // If waiting would consume all remaining budget, time out without starting another request.
        if (retryDelay >= remainingTimeout) {
          await delay(remainingTimeout, delayOptions)
          throw new TimeoutError(this.request)
        }
      }
      // Only use user-provided signal for delay, not our internal abortController
      await delay(retryDelay, delayOptions)
      this.#throwIfTotalTimeoutExhausted()
      // Apply custom request from forced retry before beforeRetry hooks
      // Ensure the custom request has the correct managed signal for timeouts and user aborts
      if (error instanceof ForceRetryError && error.customRequest) {
        const customRequest = new globalThis.Request(
          error.customRequest,
          this.#options.signal ? { signal: this.#options.signal } : undefined
        )
        // Replacement Requests are authoritative by design. Do not rewrite headers here,
        // even for cross-origin retries. Callers using `ky.retry({request})` explicitly
        // opted into the exact Request they constructed.
        this.#assignRequest(customRequest)
      }
      for (const hook of this.#options.hooks.beforeRetry) {
        let hookResult
        try {
          // eslint-disable-next-line no-await-in-loop
          hookResult = await hook({
            request: this.request,
            options: this.#getNormalizedOptions(),
            error: error,
            retryCount: this.#retryCount + 1
          })
        } catch (hookError) {
          // Preserve the original request error path (`throw error`) so beforeError hooks can still run.
          if (hookError instanceof Error && hookError !== error) {
            this.#beforeRetryHookErrors.add(hookError)
          }
          throw hookError
        }
        if (isRequestInstance(hookResult)) {
          // Same contract as `ky.retry({request})`: a Request returned from `beforeRetry`
          // is used as-is rather than being sanitized or otherwise rewritten by Ky.
          this.#assignRequest(hookResult)
          break
        }
        if (isResponseInstance(hookResult)) {
          this.#returnedResponseFromBeforeRetryHook = true
          this.#retryCount++
          return hookResult
        }
        // If `stop` is returned from the hook, the retry process is stopped
        if (hookResult === stop) {
          return
        }
      }
      this.#throwIfTotalTimeoutExhausted()
      this.#retryCount++
      return this.#retry(function_)
    }
    #consumeReturnedResponseFromBeforeRetryHook () {
      const value = this.#returnedResponseFromBeforeRetryHook
      this.#returnedResponseFromBeforeRetryHook = false
      return value
    }
    async #fetch () {
      // Reset abortController if it was aborted (happens on timeout retry)
      if (this.#abortController?.signal.aborted) {
        this.#abortController = new globalThis.AbortController()
        this.#options.signal = this.#createManagedSignal()
        // Recreate request with new signal
        this.request = new globalThis.Request(this.request, {
          signal: this.#options.signal
        })
      }
      const nonRequestOptions = findUnknownOptions(this.#options)
      const retryRequest =
        this.#options.retry.limit > 0 ? this.request.clone() : undefined
      const request = this.#wrapRequestWithUploadProgress(
        this.request,
        this.#options.body ?? undefined
      )
      // Cloning is done here to prepare in advance for retries.
      // Skip cloning when retries are disabled - cloning a streaming body calls ReadableStream#tee()
      // which buffers the entire stream in memory, causing excessive memory usage for large uploads.
      this.#originalRequest = request
      if (retryRequest) {
        this.request = retryRequest
      }
      try {
        const remainingTotal = this.#getRemainingTotalTimeout()
        if (remainingTotal !== undefined && remainingTotal <= 0) {
          throw new TimeoutError(this.request)
        }
        const effectiveTimeout =
          this.#options.timeout === false
            ? remainingTotal
            : remainingTotal === undefined
              ? this.#options.timeout
              : Math.min(this.#options.timeout, remainingTotal)
        const response =
          effectiveTimeout === undefined
            ? await this.#options.fetch(request, nonRequestOptions)
            : await timeout(request, nonRequestOptions, this.#abortController, {
              timeout: effectiveTimeout,
              fetch: this.#options.fetch
            })
        return this.#setResponseRequest(response, request)
      } catch (error) {
        if (isRawNetworkError(error)) {
          throw new NetworkError(this.request, { cause: error })
        }
        throw error
      }
    }
    #getRemainingTotalTimeout () {
      if (this.#startTime === undefined) {
        return undefined
      }
      const elapsed = this.#getCurrentTime() - this.#startTime
      return Math.max(0, this.#options.totalTimeout - elapsed)
    }
    #getCurrentTime () {
      return globalThis.performance?.now() ?? Date.now()
    }
    #getNormalizedOptions () {
      if (!this.#cachedNormalizedOptions) {
        // Exclude Ky-specific options that are not part of `RequestInit`.
        const {
          hooks,
          json,
          parseJson,
          stringifyJson,
          searchParams,
          timeout,
          totalTimeout,
          throwHttpErrors,
          fetch,
          ...normalizedOptions
        } = this.#options
        this.#cachedNormalizedOptions = Object.freeze(normalizedOptions)
      }
      return this.#cachedNormalizedOptions
    }
    #assignRequest (request) {
      this.#cachedNormalizedOptions = undefined
      this.request = request
    }
    #getResponseRequest (response) {
      return this.#responseRequests.get(response) ?? this.request
    }
    #setResponseRequest (response, request) {
      this.#responseRequests.set(response, request)
      return response
    }
    #wrapRequestWithUploadProgress (request, originalBody) {
      if (
        !this.#options.onUploadProgress ||
        !request.body ||
        !supportsRequestStreams
      ) {
        return request
      }
      return streamRequest(
        request,
        this.#options.onUploadProgress,
        originalBody ?? this.#options.body ?? undefined
      )
    }
  }

  /*! MIT License © Sindre Sorhus */
  const createInstance = defaults => {
    // eslint-disable-next-line @typescript-eslint/promise-function-async
    const ky = (input, options) =>
      Ky.create(input, validateAndMerge(defaults, options))
    for (const method of requestMethods) {
      // eslint-disable-next-line @typescript-eslint/promise-function-async
      ky[method] = (input, options) =>
        Ky.create(input, validateAndMerge(defaults, options, { method }))
    }
    ky.create = newDefaults => createInstance(validateAndMerge(newDefaults))
    ky.extend = newDefaults => {
      if (typeof newDefaults === 'function') {
        newDefaults = newDefaults(defaults ?? {})
      }
      return createInstance(validateAndMerge(defaults, newDefaults))
    }
    ky.stop = stop
    ky.retry = retry
    return ky
  }
  const ky = createInstance()
  // Intentionally not exporting this for now as it's just an implementation detail and we don't want to commit to a certain API yet at least.
  // export {NonError} from './errors/NonError.js';

  var distribution = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    ForceRetryError: ForceRetryError,
    HTTPError: HTTPError,
    KyError: KyError,
    NetworkError: NetworkError,
    SchemaValidationError: SchemaValidationError,
    TimeoutError: TimeoutError,
    default: ky,
    isForceRetryError: isForceRetryError,
    isHTTPError: isHTTPError,
    isKyError: isKyError,
    isNetworkError: isNetworkError,
    isTimeoutError: isTimeoutError,
    replaceOption: replaceOption
  })

  var require$$1 = /*@__PURE__*/ getAugmentedNamespace(distribution)

  const VERSION = '0.16.1'

  var constants = {
    VERSION,
    USER_AGENT: `mql/${VERSION}`,
    /**
     * Based on Ky default retry status codes, excluding 429:
     * https://github.com/sindresorhus/ky/blob/main/source/core/constants.ts
     */
    RETRY_STATUS_CODES: [408, 413, 500, 502, 503, 504, 521, 522, 524],
    /**
     * Based on Ky default Retry-After status codes, excluding 429:
     * https://github.com/sindresorhus/ky/blob/main/source/core/constants.ts
     */
    RETRY_AFTER_STATUS_CODES: [413, 503]
  }

  ;(function (module) {
    const { flattie: flatten } = dist
    const { default: ky } = require$$1

    const {
      VERSION,
      USER_AGENT,
      RETRY_STATUS_CODES,
      RETRY_AFTER_STATUS_CODES
    } = constants

    const ENDPOINT = {
      FREE: 'https://api.microlink.io/',
      PRO: 'https://pro.microlink.io/'
    }

    const STREAM_RESPONSE_TYPE = 'arrayBuffer'

    const kyInstance = ky.extend({
      headers: { 'user-agent': USER_AGENT },
      retry: {
        statusCodes: RETRY_STATUS_CODES,
        afterStatusCodes: RETRY_AFTER_STATUS_CODES
      }
    })

    const isObject = input => input !== null && typeof input === 'object'

    const isBuffer = input =>
      typeof input?.constructor?.isBuffer === 'function' &&
      input.constructor.isBuffer(input)

    const parseBody = (input, error, url) => {
      try {
        return JSON.parse(input)
      } catch (_) {
        const message = input || error.message

        return {
          status: 'error',
          data: { url: message },
          more: 'https://microlink.io/efatalclient',
          code: 'EFATALCLIENT',
          message,
          url
        }
      }
    }

    const isURL = url => {
      try {
        const { protocol } = new URL(url)
        return protocol === 'http:' || protocol === 'https:'
      } catch (_) {
        return false
      }
    }

    class MicrolinkError extends Error {
      constructor (props) {
        super()
        this.name = 'MicrolinkError'
        Object.assign(this, props)
        this.description = this.message
        this.message = this.code
          ? `${this.code}, ${this.description}`
          : this.description
      }
    }

    const assertUrl = (url = '') => {
      if (!isURL(url)) {
        const message = `The \`url\` as \`${url}\` is not valid. Ensure it has protocol (http or https) and hostname.`
        throw new MicrolinkError({
          status: 'fail',
          data: { url: message },
          more: 'https://microlink.io/einvalurlclient',
          code: 'EINVALURLCLIENT',
          message,
          url
        })
      }
    }

    const mapRules = rules => {
      if (!isObject(rules)) return
      return Object.fromEntries(
        Object.entries(flatten(rules)).map(([key, value]) => [
          `data.${key}`,
          value.toString()
        ])
      )
    }

    const doFetch = async (apiUrl, { responseType, ...opts }) => {
      if (opts.timeout === undefined) opts.timeout = false
      const response = await kyInstance(apiUrl, opts)
      const body = await response[responseType]()
      const { headers, status: statusCode } = response
      return { url: response.url, body, headers, statusCode }
    }

    const fetchFromApi = async (apiUrl, opts = {}) => {
      try {
        const response = await doFetch(apiUrl, opts)
        return opts.responseType === STREAM_RESPONSE_TYPE
          ? response
          : { ...response.body, response }
      } catch (error) {
        const { response = {} } = error
        const { statusCode: responseStatusCode, status } = response
        const {
          body: rawBody,
          headers: responseHeaders,
          url: uri = apiUrl
        } = response

        const statusCode = responseStatusCode ?? status
        const headers =
          typeof responseHeaders?.entries === 'function'
            ? Object.fromEntries(responseHeaders.entries())
            : responseHeaders || {}

        let bodyInput = error.data ?? rawBody
        const isBodyReadableStream = typeof bodyInput?.getReader === 'function'

        if (
          (bodyInput === undefined || isBodyReadableStream) &&
          typeof response.text === 'function'
        ) {
          try {
            bodyInput = await response.text()
          } catch (_) {
            bodyInput = undefined
          }
        }

        const isBodyBuffer = isBuffer(bodyInput)
        const body =
          isObject(bodyInput) && !isBodyBuffer
            ? bodyInput
            : parseBody(
              isBodyBuffer ? bodyInput.toString() : bodyInput,
              error,
              uri
            )

        throw new MicrolinkError({
          ...body,
          url: uri,
          statusCode,
          headers
        })
      }
    }

    const getApiUrl = (
      url,
      { data, apiKey, endpoint, ...opts } = {},
      { responseType = 'json', headers: reqHeaders = {}, ...gotOpts } = {}
    ) => {
      const isPro = !!apiKey
      const apiEndpoint = endpoint || ENDPOINT[isPro ? 'PRO' : 'FREE']

      const apiUrl = `${apiEndpoint}?${new URLSearchParams({
        url,
        ...mapRules(data),
        ...flatten(opts)
      })}`

      const headers = isPro
        ? { ...reqHeaders, 'x-api-key': apiKey }
        : reqHeaders

      if (opts.stream) responseType = STREAM_RESPONSE_TYPE

      return [apiUrl, { ...gotOpts, responseType, headers }]
    }

    const createMql = defaultOpts => async (url, opts, gotOpts) => {
      assertUrl(url)
      const [apiUrl, fetchOpts] = getApiUrl(url, opts, {
        ...defaultOpts,
        ...gotOpts
      })
      return fetchFromApi(apiUrl, fetchOpts)
    }

    const mql = createMql()

    mql.extend = createMql
    mql.MicrolinkError = MicrolinkError
    mql.getApiUrl = getApiUrl
    mql.fetchFromApi = fetchFromApi
    mql.mapRules = mapRules
    mql.version = VERSION
    mql.stream = (...args) => kyInstance(...args).then(res => res.body)

    module.exports = mql
    module.exports.arrayBuffer = mql.extend({
      responseType: STREAM_RESPONSE_TYPE
    })
    module.exports.buffer = module.exports.arrayBuffer
    module.exports.extend = mql.extend
    module.exports.fetchFromApi = mql.fetchFromApi
    module.exports.getApiUrl = mql.getApiUrl
    module.exports.mapRules = mql.mapRules
    module.exports.MicrolinkError = mql.MicrolinkError
    module.exports.version = mql.version
  })(src)

  var srcExports = src.exports
  var index = /*@__PURE__*/ getDefaultExportFromCjs(srcExports)

  return index
})

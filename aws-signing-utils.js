import moment from 'moment';
import CryptoJS from 'crypto-js';

const utils = {
  sign: (key, msg) => {
    var hash = CryptoJS.HmacSHA256(msg, key);
    return hash.toString(CryptoJS.enc.Hex);
  },

  sha256: (msg) => {
    var hash = CryptoJS.SHA256(msg);
    return hash.toString(CryptoJS.enc.Hex);
  },

  getSignatureKey: (key, dateStamp, regionName, serviceName) => {
    var kDate = CryptoJS.HmacSHA256(dateStamp, 'AWS4' + key);
    var kRegion = CryptoJS.HmacSHA256(regionName, kDate);
    var kService = CryptoJS.HmacSHA256(serviceName, kRegion);
    var kSigning = CryptoJS.HmacSHA256('aws4_request', kService);

    return kSigning;
  }
}

export function getSignedUrl( options ) {
  const params = getParams(options);
  const { protocol, host, canonicalUri } = params;
  const signature = signString(params);

  let canonicalQuerystring = getCanonicalQueryString(params);

  canonicalQuerystring += '&X-Amz-Signature=' + signature;

  return `${protocol}://${host}${canonicalUri}?${canonicalQuerystring}`;
}

export function getSignature( options ) {
  const params = getParams(options);
  return signString(params);
}

function getParams( options ) {
  const time = moment.utc();
  const dateStamp = time.format('YYYYMMDD');

  return {
    ...options,
    dateStamp,
    algorithm: 'AWS4-HMAC-SHA256',
    amzDate: dateStamp + 'T' + time.format('HHmmss') + 'Z',
  };
}

function getCanonicalQueryString( params ) {
  const { accessKey, amzDate } = params;
  const credentialScope = getCredentialScope(params);

  const canonicalQuerystring = [
    'X-Amz-Algorithm=AWS4-HMAC-SHA256',
    'X-Amz-Credential=' + encodeURIComponent(accessKey + '/' + credentialScope),
    'X-Amz-Date=' + amzDate,
    'X-Amz-Expires=86400',
    'X-Amz-SignedHeaders=host',
  ].join('&');

  return canonicalQuerystring;
}

function getCredentialScope( params ) {
  let { dateStamp, region, service } = params;
  return `${dateStamp}/${region}/${service}/aws4_request`;
}

function getCanonicalRequest( params ) {
  const canonicalQuerystring = getCanonicalQueryString(params);
  const canonicalHeaders = 'host:' + params.host;
  const payloadHash = utils.sha256('');

  const output = [
    params.method,
    params.canonicalUri,
    canonicalQuerystring,
    canonicalHeaders,
    '\nhost',
    payloadHash
  ].join('\n');

  console.log('canonical request\n' + output);

  return output;
}

function getStringToSign( params ) {
  const { algorithm, amzDate } = params;
  const credentialScope = getCredentialScope(params);
  const canonicalRequest = getCanonicalRequest(params);

  const output = [
    algorithm,
    amzDate,
    credentialScope,
    utils.sha256(canonicalRequest)
  ].join('\n');

  console.log('stringToSign\n' + output);

  return output;
}

function signString( params ) {
  const { secretKey, dateStamp, region, service } = params;

  const stringToSign = getStringToSign( params );
  const signingKey = utils.getSignatureKey(secretKey, dateStamp, region, service);

  return utils.sign(signingKey, stringToSign);
}

// if (credentials.sessionKey) {
  // console.log(credentials.sessionKey)
  //   canonicalQuerystring += '&X-Amz-Security-Token=' + tokens.refreshToken;
// }
import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'
import { verify } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
import { JwtPayload } from '../../auth/JwtPayload'
import * as middy from 'middy';


const logger = createLogger('auth')

// TODO: Provide a URL that can be used to download a certificate that can be used
// to verify JWT token signature.
// To get this URL you need to go to an Auth0 page -> Show Advanced Settings -> Endpoints -> JSON Web Key Set
// const jwksUrl = 'https://mucyomiller.us.auth0.com/.well-known/jwks.json'

const cert = `-----BEGIN CERTIFICATE-----
MIIDCzCCAfOgAwIBAgIJYQlMjo1z5PgIMA0GCSqGSIb3DQEBCwUAMCMxITAfBgNV
BAMTGG11Y3lvbWlsbGVyLnVzLmF1dGgwLmNvbTAeFw0yMDA3MDIyMzQwNDZaFw0z
NDAzMTEyMzQwNDZaMCMxITAfBgNVBAMTGG11Y3lvbWlsbGVyLnVzLmF1dGgwLmNv
bTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAOSNTcfHl478du6vM8r1
sQ23v6AHOqlGw/PpC6C+6GfedcyxWgXW5d43wnKyQjJ8Y8UjwqWQkhhQficVd71N
SFQ0OGBjqMpvw4su71OvFHmWtlVIuxS4QCNbN33v5K5y+bLGAsW7uo4NMVxwujFA
6It9FqW9RhDmpKbk/abZJ+5j5GkMUGyLG7V9FDfOEIfC2P6XBMfQy5B+f4XQfrxA
TAxeV2CtJW3OxzRniKyfTivTw/1eT2lVvVVYXiURWEOCR/ZogY/zb7JcKyPKicA2
Hbtlyqg9Ji1ZpDa/qdHAw1sFVbw9U82+ZZ5pLkt8reKwsjG6ETbM02aA+Kn3dKEH
MRsCAwEAAaNCMEAwDwYDVR0TAQH/BAUwAwEB/zAdBgNVHQ4EFgQUUXKnBzv9jy9b
hpeOWdb+XG6686QwDgYDVR0PAQH/BAQDAgKEMA0GCSqGSIb3DQEBCwUAA4IBAQCk
rMb7KG3AAIBDuR39oXKPwUy/bKMfnoeR4Q2n7VJmmfcf+ew5n4EsMwpJXV4Y81t9
S0Rl4YgLPjO5PJy1HwNqZPC/FIGSheX3hfYTGdUdfOuQoN40CQzOQOv8nunoHrGu
KxBKsk2tmCI29Ypuhm+bsOs0JK2iwk+uxhMXjtNLaAKR3ETw0L7hDRP7f8ChQLqu
RgkM0oqR8VE8CH3euQ5ZIL0qnVsEkIgLk4LsF2PUxEaNgVyU8pBjrt9KO1nkV7uy
Y5Qf+ZP23AHShN33xzQdiYn9pZ3n1gSb1mVPnXkFJDXmzQ0LJWbCO2bYTsuk9w9m
3rkuZJLpnkImjkETaayI
-----END CERTIFICATE-----`

export const handler = middy(async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
})

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const token = getToken(authHeader)
  // You should implement it similarly to how it was implemented for the exercise for the lesson 5
  // You can read more about how to do this here: https://auth0.com/blog/navigating-rs256-and-jwks/
  return verify(token, cert, { algorithms: ['RS256'] }) as JwtPayload
}

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}

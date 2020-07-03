import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import * as uuid from 'uuid'
import * as AWS from 'aws-sdk'

const docClient = new AWS.DynamoDB.DocumentClient()
const todosTable = process.env.TODOS_TABLE
const s3 = new AWS.S3({
  signatureVersion: 'v4'
})

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId

  const BUCKET = process.env.S3_BUCKET
  const URL_EXP = process.env.SIGNED_URL_EXPIRATION
  const imageId = uuid.v4()

  const signedUrl = s3.getSignedUrl('putObject', {
    Bucket: BUCKET,
    Key: imageId,
    Expires: URL_EXP
  })

  const imageUrl = `https://${BUCKET}.s3.amazonaws.com/${imageId}`

  // update existing image URL on current TODO
  const updateImageUrl = {
    TableName: todosTable,
    Key: { "todoId": todoId },
    UpdateExpression: "set attachmentUrl = :a",
    ExpressionAttributeValues: {
      ":a": imageUrl
    },
    ReturnValues: "UPDATED_NEW"
  }
  await docClient.update(updateImageUrl).promise()

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      uploadUrl: signedUrl
    })
  }
}

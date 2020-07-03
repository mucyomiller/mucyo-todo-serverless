import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import * as AWS from 'aws-sdk'
import { getUserId } from '../utils'

const docClient = new AWS.DynamoDB.DocumentClient()
const todosTable = process.env.TODOS_TABLE

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log(`event -> ${JSON.stringify(event, null, 2)}`)
  const todoId = event.pathParameters.todoId
  console.log(`todoId -> ${todoId}`)

  const isValidTodo = await isTodoExist(todoId)
  if (!isValidTodo) {
    return {
      statusCode: 404,
      headers: {
        'Access-Control-Allow-Origin': "*"
      },
      body: JSON.stringify({
        error: 'This Todo does\'nt exist!'
      })
    }
  }

  const params = {
    TableName: todosTable,
    userId: getUserId(event),
    Key: {
      todoId: todoId
    }
  }

  let err: AWS.AWSError, data: AWS.DynamoDB.DocumentClient.DeleteItemOutput = await docClient.delete(params).promise()
  if (err) {
    console.error(` we were unable to delete this Todo ${JSON.stringify(err, null, 2)}`);
  } else {
    console.log(`Todo was deleted successfully ${JSON.stringify(data, null, 2)}`);
  }

  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      message: 'Item successfully removed'
    })
  }
}

async function isTodoExist(todoId: string) {
  const result = await docClient
    .get({
      TableName: todosTable,
      Key: {
        todoId: todoId
      }
    })
    .promise()
  return !!result.Item
}
import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'
import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'
import * as AWS from 'aws-sdk'
import { getUserId } from '../utils'

const docClient = new AWS.DynamoDB.DocumentClient()
const todosTable = process.env.TODOS_TABLE

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log(`event -> ${JSON.stringify(event, null, 2)}`)
  const todoId = event.pathParameters.todoId
  console.log(`todoId -> ${todoId}`)

  const updatedTodo: UpdateTodoRequest = JSON.parse(event.body)
  
  const isTodoAvailable = await isTodoExist(todoId)
  if (!isTodoAvailable) {
    return {
      statusCode: 404,
      headers: {
        'Access-Control-Allow-Origin': "*"
      },
      body: JSON.stringify({
        error: 'This Todo You\'re trying to update  does\'nt exist!'
      })
    }
  }
  const oldOne = await retrieveTodo(todoId);

  const updatedItem = {
    todoId: todoId,
    userId: getUserId(event),
    createdAt: oldOne.createdAt,
    attachmentUrl: oldOne.attachmentUrl,
    ...updatedTodo
  }

  await docClient.put({
    TableName: todosTable,
    Item: updatedItem
  }).promise()

  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      updatedItem
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

async function retrieveTodo(todoId: string) {
  const result = await docClient
    .get({
      TableName: todosTable,
      Key: {
        todoId: todoId
      }
    })
    .promise()
  return result.Item
}
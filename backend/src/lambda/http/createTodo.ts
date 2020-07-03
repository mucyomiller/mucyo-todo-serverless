import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import * as AWS from 'aws-sdk'
import * as uuid from 'uuid'
import { getUserId } from '../utils'

const docClient = new AWS.DynamoDB.DocumentClient()
const todosTable = process.env.TODOS_TABLE

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

  console.log(`event -> ${JSON.stringify(event, null, 2)}`)
  const todoId = uuid.v4()
  console.log(`todoId -> ${todoId}`)

  const newTodo: CreateTodoRequest = JSON.parse(event.body)

  const createdTodo = {
    todoId,
    userId: getUserId(event),
    ...newTodo
  }

  await docClient.put({
    TableName: todosTable,
    Item: createdTodo
  }).promise()

  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
      item: createdTodo
    })
  }
}

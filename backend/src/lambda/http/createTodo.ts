import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import { getUserId } from '../utils'
import { TodoItem } from '../../models/TodoItem'
import { createTodo } from '../../businessLogic/todos'

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

  console.log(`event -> ${JSON.stringify(event, null, 2)}`)
  const request: CreateTodoRequest = JSON.parse(event.body)
  const userId: string = getUserId(event);
  const createdTodo: TodoItem = await createTodo(request, userId);

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

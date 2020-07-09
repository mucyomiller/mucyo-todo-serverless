import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'
import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'
import { getUserId } from '../utils'
import { isTodoExist, updateTodo } from '../../businessLogic/todos'
import { TodoItem } from '../../models/TodoItem'

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log(`event -> ${JSON.stringify(event, null, 2)}`)
  const todoId: string = event.pathParameters.todoId
  const userId: string = getUserId(event);
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
  const updatedItem: TodoItem = await updateTodo(updatedTodo, todoId, userId);
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
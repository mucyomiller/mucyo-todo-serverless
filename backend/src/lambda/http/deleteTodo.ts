import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import { isTodoExist, deleteTodo } from '../../businessLogic/todos'
import { getUserId } from '../utils'

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log(`event -> ${JSON.stringify(event, null, 2)}`)
  const todoId: string = event.pathParameters.todoId
  const userId: string = getUserId(event);

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

  const deleted: Boolean = await deleteTodo(todoId, userId);
  if (!deleted) {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Oops Unexpected error happened while trying  to remove Todo'
      })
    }
  }
  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      message: 'Successfully removed Todo'
    })
  }
}
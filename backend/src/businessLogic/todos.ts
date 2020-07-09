import { TodoItem } from '../models/TodoItem'
import { TodosAccess } from '../dataLayer/todosAccess'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest';

const todoAccess = new TodosAccess();

export async function getAllTodos(userId: string): Promise<TodoItem[]> {
    const items = await todoAccess.getUserTodos(userId);
    return items;
}

export async function createTodo(request: CreateTodoRequest, userId: string): Promise<TodoItem> {
    return await todoAccess.createTodo(request, userId);
}

export async function deleteTodo(todoId: string, userId: string): Promise<Boolean> {
    return await todoAccess.deleteTodoById(todoId, userId);
}

export async function isTodoExist(todoId: string): Promise<Boolean> {
    return await todoAccess.isTodoExist(todoId);
}

export async function getSignedURL(todoId: string): Promise<string> {
    return await todoAccess.getSignedURL(todoId);
}
export async function updateTodo(updatedTodo: UpdateTodoRequest, todoId: string, userId: string): Promise<TodoItem> {
    return await todoAccess.updateTodo(updatedTodo, todoId, userId);
}
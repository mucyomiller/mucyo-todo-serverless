import { TodoItem } from "../models/TodoItem";
import { CreateTodoRequest } from "../requests/CreateTodoRequest";
import { UpdateTodoRequest } from "../requests/UpdateTodoRequest";
import * as uuid from 'uuid'
import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { createLogger } from "../utils/logger";


const XAWS = AWSXRay.captureAWS(AWS)
const logger = createLogger('TodosAccess');

export class TodosAccess {
    constructor(
        private readonly docClient: AWS.DynamoDB.DocumentClient = new XAWS.DynamoDB.DocumentClient(),
        private readonly s3: AWS.S3 = new AWS.S3({ signatureVersion: 'v4' }),
        private readonly todosTable = process.env.TODOS_TABLE,
        private readonly userIdIndex = process.env.USER_ID_INDEX
    ) { }

    async getUserTodos(userId: string): Promise<TodoItem[]> {
        const result = await this.docClient.query({
            TableName: this.todosTable,
            IndexName: this.userIdIndex,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            }
        }).promise()

        return result.Items as TodoItem[]
    }

    async createTodo(request: CreateTodoRequest, userId: string): Promise<TodoItem> {
        const todoId = uuid.v4()
        const createdTodo = {
            todoId,
            userId,
            ...request
        }
        await this.docClient.put({
            TableName: this.todosTable,
            Item: createdTodo
        }).promise()

        return createdTodo as TodoItem;
    }


    async getTodoById(id: string, userId: string): Promise<TodoItem> {
        const result = await this.docClient
            .get({
                TableName: this.todosTable,
                Key: {
                    todoId: id,
                    userId: userId
                }
            })
            .promise()
        return result.Item as TodoItem
    }

    async isTodoExist(id: string, userId: string): Promise<Boolean> {
        const result = await this.docClient
            .get({
                TableName: this.todosTable,
                Key: {
                    todoId: id,
                    userId: userId
                }
            })
            .promise()
        const response = !!result.Item;
        logger.debug(`assertion reponse -> ${response}`);
        return response;
    }

    async updateTodo(updatedTodo: UpdateTodoRequest, todoId: string, userId: string): Promise<TodoItem> {

        const oldOne = await this.getTodoById(todoId, userId);

        const updatedItem = {
            todoId,
            userId,
            createdAt: oldOne.createdAt,
            attachmentUrl: oldOne.attachmentUrl,
            ...updatedTodo
        }

        await this.docClient.put({
            TableName: this.todosTable,
            Item: updatedItem
        }).promise()

        return updatedItem as TodoItem
    }

    async deleteTodoById(todoId: string, userId: string): Promise<Boolean> {
        const params = {
            TableName: this.todosTable,
            userId: userId,
            Key: {
                todoId: todoId,
                userId: userId
            }
        }

        let err: AWS.AWSError, data: AWS.DynamoDB.DocumentClient.DeleteItemOutput = await this.docClient.delete(params).promise();
        if (err) {
            console.error(` we were unable to delete this Todo ${JSON.stringify(err, null, 2)}`);
            return false;
        }
        console.log(`Todo was deleted successfully ${JSON.stringify(data, null, 2)}`);
        return true;
    }

    async getSignedURL(todoId: string, userId: string): Promise<string> {

        const BUCKET = process.env.S3_BUCKET
        const URL_EXP = process.env.SIGNED_URL_EXPIRATION
        const imageId = uuid.v4()

        const signedUrl = this.s3.getSignedUrl('putObject', {
            Bucket: BUCKET,
            Key: imageId,
            Expires: URL_EXP
        })

        const imageUrl = `https://${BUCKET}.s3.amazonaws.com/${imageId}`

        // update existing image URL on current TODO
        const updateImageUrl = {
            TableName: this.todosTable,
            Key: { "todoId": todoId, "userId": userId },
            UpdateExpression: "set attachmentUrl = :a",
            ExpressionAttributeValues: {
                ":a": imageUrl
            },
            ReturnValues: "UPDATED_NEW"
        }
        await this.docClient.update(updateImageUrl).promise()
        return signedUrl;
    }

}
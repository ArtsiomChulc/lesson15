import {todoListsAPI, TodolistType} from '../../api/todo-lists-a-p-i'
import {Dispatch} from 'redux'
import {RequestStatusType, setErrorAC, setErrorType, setStatusAC, setStatusType} from "../../app/app-reducer";

const initialState: Array<TodolistDomainType> = []

enum ResultCode {
    OK = 0,
    Error = 1,
    Captcha = 10
}

export const todolistsReducer = (state: Array<TodolistDomainType> = initialState, action: ActionsType): Array<TodolistDomainType> => {
    switch (action.type) {
        case 'REMOVE-TODOLIST':
            return state.filter(tl => tl.id !== action.id)
        case 'ADD-TODOLIST':
            return [{...action.todolist, filter: 'all', entityStatus: 'idle'}, ...state]
        case 'CHANGE-TODOLIST-TITLE':
            return state.map(tl => tl.id === action.id ? {...tl, title: action.title} : tl)
        case 'CHANGE-TODOLIST-FILTER':
            return state.map(tl => tl.id === action.id ? {...tl, filter: action.filter} : tl)
        case 'SET-TODOLISTS':
            return action.todolists.map(tl => ({...tl, filter: 'all', entityStatus: 'idle'}))
        case 'CHANGE-ENTITY-STATUS':
            return state.map((tl) => action.id === tl.id ? {...tl, entityStatus: action.status} : tl)
        default:
            return state
    }
}

// actions
export const removeTodolistAC = (id: string) => ({type: 'REMOVE-TODOLIST', id} as const)
export const addTodolistAC = (todolist: TodolistType) => ({type: 'ADD-TODOLIST', todolist} as const)
export const changeTodolistTitleAC = (id: string, title: string) => ({
    type: 'CHANGE-TODOLIST-TITLE',
    id,
    title
} as const)
export const changeTodolistFilterAC = (id: string, filter: FilterValuesType) => ({
    type: 'CHANGE-TODOLIST-FILTER',
    id,
    filter
} as const)
export const changeEntityStatusAC = (id: string, status: RequestStatusType) => ({
    type: 'CHANGE-ENTITY-STATUS',
    id,
    status
} as const)
export const setTodolistsAC = (todolists: Array<TodolistType>) => ({
    type: 'SET-TODOLISTS',
    todolists: todolists
} as const)

// thunks
export const fetchTodolistsTC = () => {
    return (dispatch: Dispatch<ActionsType>) => {
        dispatch(setStatusAC('loading'))
        todoListsAPI.getTodoLists()
            .then((res) => {
                dispatch(setTodolistsAC(res.data))
                dispatch(setStatusAC('succeeded'))
            })
    }
}
export const removeTodolistTC = (todolistId: string) => {
    return (dispatch: Dispatch<ActionsType>) => {
        dispatch(setStatusAC('loading'))
        dispatch(changeEntityStatusAC(todolistId, 'loading'))
        todoListsAPI.deleteTodolist(todolistId)
            .then((res) => {
                if (res.data.resultCode === ResultCode.OK) {
                    dispatch(removeTodolistAC(todolistId))
                    dispatch(setStatusAC('succeeded'))
                } else {
                    if (res.data.messages.length) {
                        dispatch(setErrorAC(res.data.messages[0]))
                    } else {
                        dispatch(setErrorAC('Обратитесь к администратору.'))
                    }
                }
            })
            .catch((error) => {
                dispatch(setStatusAC('failed'))
                dispatch(changeEntityStatusAC(todolistId, 'failed'))
                dispatch(setErrorAC(error.message))
            })
    }
}
export const addTodolistTC = (title: string) => {
    return (dispatch: Dispatch<ActionsType>) => {
        dispatch(setStatusAC('loading'))
        todoListsAPI.createTodolist(title)
            .then((res) => {
                if (res.data.resultCode === ResultCode.OK) {
                    dispatch(addTodolistAC(res.data.data.item))
                } else {
                    if (res.data.messages.length) {
                        dispatch(setErrorAC(res.data.messages[0]))
                    } else {
                        dispatch(setErrorAC('Обратитесь к администратору.'))
                    }
                }
                dispatch(setStatusAC('succeeded'))
            })
    }
}
export const changeTodolistTitleTC = (id: string, title: string) => {
    return (dispatch: Dispatch<ActionsType>) => {
        todoListsAPI.updateTodolist(id, title)
            .then((res) => {
                dispatch(changeTodolistTitleAC(id, title))
            })
    }
}

// types
export type AddTodolistActionType = ReturnType<typeof addTodolistAC>;
export type RemoveTodolistActionType = ReturnType<typeof removeTodolistAC>;
export type SetTodolistsActionType = ReturnType<typeof setTodolistsAC>;
type ActionsType =
    | RemoveTodolistActionType
    | AddTodolistActionType
    | ReturnType<typeof changeTodolistTitleAC>
    | ReturnType<typeof changeTodolistFilterAC>
    | ReturnType<typeof changeEntityStatusAC>
    | SetTodolistsActionType
    | setStatusType
    | setErrorType
export type FilterValuesType = 'all' | 'active' | 'completed';
export type TodolistDomainType = TodolistType & {
    filter: FilterValuesType
    entityStatus: RequestStatusType
}

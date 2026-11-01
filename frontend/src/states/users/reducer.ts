import { ActionType } from './action';

interface UserAction {
  type: string,
  payload?: {
    users: any[]
  };
}

function usersReducer(users: any[] = [], action: UserAction = { type: ''}) {
  switch (action.type) {
  case ActionType.RECEIVE_USERS:
    return action.payload.users;
  default:
    return users;
  }
}

export default usersReducer;

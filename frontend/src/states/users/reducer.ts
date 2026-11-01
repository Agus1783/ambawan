import { ActionType } from './action';
import type { User } from '../../interfaces/UserInterface';

interface UserAction {
  type: string,
  payload?: {
    users: User[]
  };
}

function usersReducer(users: User[] = [], action: UserAction = { type: ''}) {
  switch (action.type) {
  case ActionType.RECEIVE_USERS:
    return action.payload ? action.payload.users : users;
  default:
    return users;
  }
}

export default usersReducer;

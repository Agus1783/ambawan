import api from '../../utils/api';
import type { User } from '../../interfaces/UserInterface';

const ActionType = {
  RECEIVE_USERS: 'RECEIVE_USERS'
};

function receiveUsersActionCreator(users: User[]) {
  return {
    type: ActionType.RECEIVE_USERS,
    payload: {
      users,
    },
  };
}

function asyncRegisterUser({ name, email, password }: {name: string, email: string, password: string}) {
  return async () => {
    // dispatch(showLoading());

    try {
      await api.register({ name, email, password });
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Register gagal');
    }

    // dispatch(hideLoading());
  };
}

export {
  ActionType,
  receiveUsersActionCreator,
  asyncRegisterUser,
};

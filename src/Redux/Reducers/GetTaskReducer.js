import { GetTaskType } from "../Type";

export const GettaskListReducer = (state = null , action) => {
    switch (action.type) {
        case GetTaskType:
          return action.payload;
        default:
          return state;
      }

    
  };
  

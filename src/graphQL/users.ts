export const user_all = `
mutation user_all {
  user_all {
    result
    message
    data {
      _id
      email
      name
      role
      state
    }
    token
  }
}
`;

export const addNewUser = `
mutation addNewUser($name: String!, $email: String!, $password: String!, $language: String!) {
  add_user (
    input: {
      name: $name
      email: $email
      password: $password      
      language: $language      
    }
  ) {
    result
    message
    data {
      _id
      email
    }
    token
  }
}
`;

export const updateUser = `
mutation updateUser($email: String!, $name: String!, $state: Int!) {
  user_info_update (    
    email: $email
    name: $name
    state: $state
  ) {
    result
    message
    data 
    token
  }
}
`;

export const deleteUser = `
mutation deleteUser($email: String!) {
  user_delete ( 
    email: $email
  ) {
    result
    message
    data 
    token
  }
}
`;

export const user_password_reset = `
mutation user_password_reset($email: String!, $password: String!) {
  user_password_reset (   
    email: $email
    password: $password 
  ) {
    result
    message
    data
    token
  }
}
`;

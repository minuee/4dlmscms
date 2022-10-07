export const user_my = `
mutation user_my {
  user_my {
    result
    message
    data {
  		_id
      email
      name
      state

    }
  }
}
`;

export const user_update = `
mutation user_update(
  $name: String!, 
  $phone: String!, 
  $language: String!
  ) {
    user_update (
      name: $name
      phone: $phone              
      language: $language              
    ) {
        result
        message
        data {
          _id
          email
          name
          role
          recent_login
          createdAt 
        }
      }
    }
`;

export const user_password_change = `
mutation user_password_change(
  $_id: String!,
  $pre_password: String!, 
  $next_password: String!
  ) {
      user_password_change (
        _id: $_id
        pre_password: $pre_password
        next_password: $next_password
      ) {
      result
      message
      data
      }
  }
`;

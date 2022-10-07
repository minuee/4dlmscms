export const userRegistrationCode = `
        mutation userRegistrationCode($email: String!, $locale: String!) {
          user_registration_code (
            email: $email,
            locale: $locale
          ) {
            result
            message
          }
        }
      `;

export const createUser = `
mutation createUser($name: String!, $email: String!, $password: String!, $language: String!, $code: String!) {
  create_user (
    input: {
      name: $name
      email: $email
      password: $password
      language: $language
      code: $code
    }
  ) {
    result
    message
    data {
      _id
      email
    }
  }
}
`;

export const user_login = `
mutation user_login($email: String!, $password: String!) {
  user_login (
    email: $email
    password: $password              
  ) {
    result
    message
    data {                
      _id
      temp_token
      mfa_info
    }
  }
}
`;

export const user_login_session = `
mutation user_login_session($email: String!, $password: String!) {
  user_login_session (
    email: $email
    password: $password              
  ) {
    result
    message
    data {                
      token
      user_info {
        _id
        email
        name
        role
        state
        recent_login
        createdAt
        language                  
      }
    }
  }
}
`;

export const user_password_code = `
mutation user_password_code(
  $email: String!, $locale:String!
  ){
    user_password_code(
    email: $email
    locale: $locale
    ){
      result
      message
      data 
  }
}
`;

export const user_password_update_with_code = `
mutation user_password_update_with_code(
    $email: String!, 
    $code:String!,
    $next_password: String!
    ){
      user_password_update_with_code(
        email: $email
        code: $code
        next_password: $next_password
      ){
      result
      message
      data 
  }
}
`;

// 2 factor authentification
export const create_2fa_for_token = `
mutation create_2fa_for_token(
    $_id: String!, 
    $temp_token:String!,
    ){
      create_2fa_for_token(
        _id: $_id
        temp_token: $temp_token
      ){
      result
      message
      data {
        _id
        qr_secret
        qr_code_url
      }
  }
}
`;
export const verify_2fa_for_token = `
mutation verify_2fa_for_token(
    $_id: String!, 
    $otp_token: String!, 
    $otp_secret: String!,
    $temp_token:String!,
    ){
      verify_2fa_for_token(
        _id: $_id
        otp_token: $otp_token
        otp_secret: $otp_secret
        temp_token: $temp_token
      ){
      result
      message
      data {
       token
       user_info{
         _id
         name
         phone
         role
         language
         state
         recent_login
        }
      }
  }
}
`;

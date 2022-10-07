// 베뉴 리스트
export const listVenue = `
query listVenue(
    $pageNo: Int, $pageSize: Int, $sortColumn: String, $isDecending: Boolean
    ){
    listVenue(
        pageNo:$pageNo, 
        pageSize:$pageSize, 
        sortColumn:$sortColumn, 
        isDecending:$isDecending
        ) {
        id
        country_id
        state_id
        city_id
        name
        description
        timezone_name
        timezone_offset
        comment
        updated_at
        registered_at
        }
    }
     `;

//  하나의 베뉴 데이터
export const getVenue = `
query getVenue($venue_id: String!){
    getVenue(
    venue_id: $venue_id
    ) {
        id
        country_id
        state_id
        city_id
        name
        description
        timezone_name
        timezone_offset
        comment
        updated_at
        registered_at
    }
}
`;

// 베뉴 생성
export const insertVenue = `
query insertVenue(
    $event_name: String!, $event_yymm: String!, $name: String!, $description: String!, $country_id: Int!, $state_id: Int, $city_id: Int, $timezone_name: String!, $timezone_offset: String!
    ){
    insertVenue(
        event_name:$event_name
        event_yymm:$event_yymm
        name:$name
        description:$description
        country_id:$country_id
        state_id:$state_id
        city_id:$city_id
        timezone_name:$timezone_name
        timezone_offset:$timezone_offset
    ) {
        id
    }
}
`;

// 베뉴 업데이트
export const updateVenue = `
query updateVenue(
    $event_name: String!, $event_yymm: String!, $name: String!, $description: String!, $country_id: Int!, $state_id: Int, $city_id: Int, $timezone_name: String!, $timezone_offset: String!
    ){
    updateVenue(
        event_name:$event_name
        event_yymm:$event_yymm
        name:$name
        description:$description
        country_id:$country_id
        state_id:$state_id
        city_id:$city_id
        timezone_name:$timezone_name
        timezone_offset:$timezone_offset
    ) {
        id
    }
}
`;

// 베뉴 삭제
export const deleteVenue = `
query deleteVenue($venue_id: String!){
    deleteVenue(
    venue_id: $venue_id
    ) 
}
`;

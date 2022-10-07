// 기본 시스템 관련 쿼리/뮤테이션들

// 리스트
export const listSystem = `
    query listSystem(
        $pageNo: Int, $pageSize: Int, $sortColumn: String, $isDecending: Boolean
    ) {
        listSystem(
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

// 하나의 시스템
export const getSystem = `
query getSystem($system_id: String!){
    getSystem(
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

// 시스템 생성
export const insertSystem = `
query insertSystem(
    $name: String!, 
    $description: String!, 
    $venue_id: String!, 
    $fps: Float, 
    $width: Int, 
    $height: Int, 
    $is_extra: String, 
    $comment: String, 
    $subinfo_updated_at: String
    ){
        insertSystem(
        name:$name
        description:$description
        venue_id:$venue_id
        fps:$fps
        width:$width
        height:$height
        is_extra:$is_extra
        comment:$comment
        subinfo_updated_at:$subinfo_updated_at
    ) {
        id
    }
}
`;

// 시스템 업데이트
export const updateSystem = `
query updateSystem(
    $name: String!, 
    $description: String!, 
    $venue_id: String!, 
    $fps: Float, 
    $width: Int, 
    $height: Int, 
    $is_extra: String, 
    $comment: String, 
    $subinfo_updated_at: String
    ){
        updateSystem(
        name:$name
        description:$description
        venue_id:$venue_id
        fps:$fps
        width:$width
        height:$height
        is_extra:$is_extra
        comment:$comment
        subinfo_updated_at:$subinfo_updated_at
    ) {
        id
    }
}
`;

// 시스템 삭제
export const deleteSystem = `
query deleteSystem($system_id: String!){
    deleteSystem(
        system_id: $system_id
    ) 
}
`;

//////////////////////////////////////////////
// 그룹 group
//////////////////////////////////////////////

//////////////////////////////////////////////
// 룰 rule
//////////////////////////////////////////////
//////////////////////////////////////////////
// 스케일 scale
//////////////////////////////////////////////
//////////////////////////////////////////////
// 노드 node
//////////////////////////////////////////////
//////////////////////////////////////////////
// 채널 channel
//////////////////////////////////////////////

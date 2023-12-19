const paginator = require("../utils/paginator");
//상세 페이지  게시글 데이터를 가져오는 함수 추가
const { ObjectId } = require("mongodb");

//글쓰기 로직
async function writePost(collection, post) {
  // writePost는 post를 board 컬렉션에 저장하는 함수입니다. 매개변수로 collection과 post를 받습니다.
  // 생성일시와 조회수를 넣어줍니다.
  post.hit = 0;
  post.createDt = new Date().toISOString(); // 날짜는 ISO 포맷으로 저장
  // 날짜 정보를 저장 시에는 ISO 포맷으로 저장하는 것이 좋습니다. 그래야 시간대가 다른 곳에서도 다양한 포맷으로 변환이 용이합니다.
  return await collection.insertOne(post); // 몽고디비에 post를 저장 후 결과 반환
  // collection의 insertOne()함수를 사용해 컬렉션에 post를 저장합니다. 결과값은 프로미스로 반환됩니다.
}

async function list(collection, page, search) {
  const perPage = 10;
  // 1. title이 search와 부분일치하는지 확인
  const query = { title: new RegExp(search, "i") };
  // 2. limit는 10개만 가져온다는 의미, skip은 설정된 개수만큼 건너뛴다(skip). 생성일 역순으로 정렬
  const cursor = collection
    .find(query, { limit: perPage, skip: (page - 1) * perPage })
    .sort({ createDt: -1 });
  // 3. 검색어에 걸리는 게시물의 총합
  const totalCount = await collection.count(query);
  // 4. 커서로 받아온 데이터를 리스트로 변경
  const posts = await cursor.toArray();
  // 5. 페이지네이터 생성
  const paginatorObj = paginator({ totalCount, page, perPage: perPage });
  return [posts, paginatorObj];
}
// list() 함수는 collection, page, search 3개의 매개변수를 받습니다. 그리고 내부에 변수가 여러 개 있는데, perPage는 한 페이지에 노출할 글 개수를 의미합니다. 글 목록 리스트를 가져오려면
// 몽고디비 collection의 find() 함수를 사용해야 합니다. find()함수는 find(query, option)으로 구성되며, 뒤에 sort()등을 사용해서 정렬도 가능합니다. 글 목록 리스트 코드에서는 조건문 추가, 갯수 제한, 건너뛰기, 정렬을 모두 사용합니다
// 1. 몽고디비의 쿼리(조회)는 실제로 자바스크립트 문법과 매우 유사하며 SQL에서 사용하는 like와 같은 형식의 검색은 정규포현식을 사용합니다.
// 2. find() cursor를 반환합니다. cursor에는 여러 메서드가 있지만, 여기서는 받아온 데이터를 배열로 변경하는 toArray() 메서드를 사용해 게시글 데이터를 리스트로 변경합니다. 옵션으로 limit, skip을 주었습니다. limit가 10이므로 최대 10개의 데이터만 쿼리를 합니다. skip은 1페이지인 경우 1~10까지만 가져오고 2페이지인 경우 11~20까지만 가져오기 위해 사용합니다. sort()함수를 사용해 생성일(createDt)의 역순으로 가져오도록 했습니다. 예제에서는 필드를 하나만 사용했지만, sort() 함수에 필드를 여러 개 추가할 수도 있습니다.
// 3. totalCount는 페이지네이터에서 사용합니다.
// 4. toArray()함수는 두 가지가 있습니다. 한 가지는 Promise를 사용했습니다. 반환값이 Promise 타입인 경우 await를 써주면 원하는 값이나옵니다.
// 5. 페이지네이터는 다음의 페이지네이터 함수에서 설명드리겠습니다.

// 1. 패스워드는 노출 할 필요가 없으므로 결괏값으로 가져오지 않음
const projectionOption = {
  projection: {
    // 프로젝션(투영) 결괏값에서 일부만 가져올 때 사용
    password: 0,
    "comments.password": 0,
  },
};
// 프로젝션은 투영이라는 뜻이지만, 데이터베이스에서는 데이터베이스에서 필요한 피드들만 선택해서 가져오는 것을 말합니다. 예제에서는 게시글의 패스워드와 게시글에 달린 댓글들의
// 패스워드 항목을 가져오지 않아도 되므로 해당 설정을 추가했습니다. 가져와야 하는 항목이 빼는 항목보다 많아서 projection: {password:0}과 같이 패스워드만 항목에서 빼는 프로젝션 설정을했습니다만,
// 반대로 빼야 하는 항목이 가져와야 하는 항목보다 많은 경우는 projection: {title: 1, content: 1}과 같은 방식으로 가져와야 하는 데이터만 프로젝션할 수 있습니다.

async function getDetailPost(collection, id) {
  // 2. 몽고디비 Collection의 findOneAndUpdate() 함수를 사용
  // 게시글을 읽을 때마다 hits를 1 증가
  return await collection.findOneAndUpdate(
    { _id: ObjectId(id) },
    { $inc: { hits: 1 } },
    projectionOption
  );
}
// getDatilPost()함수는 하나의 게시글 정보를 가져옵니다. 하는 일은 두가지입니다.
// 하나는 게시글의 정보를 가져오는 것이고, 다른 하나는 게시글을 읽을 때마다 hits를 1씩 증가시키는 겁니다. 이를 위해 findOneAndUpdate() 함수를 사용했습니다. <= 해당 내용은 구조 참고

// 1. findOne() 함수 사용
// 몽고디비 collection의 findOne() 함수를 사용합니다. findOne(filter, option)의 형태로 사용합니다. 예제 코드에서는 filter는 id와 password입니다.
// 즉 해당 게시물의 패스워드가 입력 받은 값과 일치하면 post 객체를 돌려주는 겁니다. projectionOption은 상세페이지 API 때와 마찬가지로 패스워드를 뺴고 데이터를 가져오는데 사용
async function getPostByIdAndPassword(collection, { id, password }) {
  return await collection.findOne(
    { _id: ObjectId(id), password: password },
    projectionOption
  );
}

// 2. id로 데이터 불러오기
// getPostById() 함수는 getPostByIdAndPassword()와 완전히 똑같으며 매개변수에 password가 있으냐 없으냐의 차이가 있습니다. 다음에 작성할 수정 페이지 이동 API에서 사용합니다.
async function getPostById(collection, id) {
  return await collection.findOne({ _id: ObjectId(id) }, projectionOption);
}

// 3. 게시글 수정
// updatePost()는 게시글을 업데이트합니다. updateOne() 함수를 사용해 하나의 도큐먼트만 수정합니다. 필터 조건으로는 id만을 주었습니다. 갱신할 데이터는 $set의 속성값으로 넣어주면 됩니다.
// 다른 함수들과 마찬가지로 async await를 사요했습니다. 이후 게시글 수정 시 사용합니다.
async function updatePost(collection, id, post) {
  const toUpdatePost = {
    $set: {
      ...post,
    },
  };
  return await collection.updateOne({ _id: ObjectId(id) }, toUpdatePost);
}
module.exports = {
  // require()로 파일을 임포트 시 외부로 노출하는 객체
  writePost, // module.exports에는 require()로 파일을 임포트할 떄 외부로 노출하는 객체를 모아둡니다. post-service에서는 현재 wirtePost만 노출합니다
  list,
  getDetailPost,
  getPostById,
  getPostByIdAndPassword,
  updatePost,
};

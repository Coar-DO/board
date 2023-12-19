const express = require("express"); // express express 자체로 등록
const handlebars = require("express-handlebars"); // handlebars = express-handlebars 등록
const postService = require("./services/post-service"); // post-service.js를 로딩하고 writePost 변수에 적절한 함수를 할당
const { ObjectId } = require("mongodb");
const app = express(); // 익스프레스 = app 등록
//req.body와 POST 요청을 해석하기 위한 설정
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const mongodbConnection = require("./configs/mongodb-connection"); // 만들어둔 몽고디비 연결용 함수를 임포트합니다. mongodbConnection(콜백 함수) 같은 형태로 사용

app.engine(
  "handlebars",
  handlebars.create({
    helpers: require("./configs/handlebars-helpers"),
  }).engine
);
// 1. 템플릿 엔진으로 핸들바 등록
// handlebars.create() 함수는 handlenars 객체를 만들 때 사용합니다. 옵션에서 헬퍼 함수를 추가 할 수 있습니다.
// helpers: require("./configs/handlebars-helpers") 커스텀 헬퍼 함수를 추가합니다.

app.set("view engine", "handlebars"); // 2. 웹페이지 로드 시 사용할 템플릿 엔진 설정
app.set("views", __dirname + "/views"); // 3. 뷰 디렉터리를 views로 설정

// 4. 라우터 설정

app.get("/", async (req, res) => {
  const page = parseInt(req.query.page) || 1; // 현재 페이지 데이터
  const search = req.query.search || ""; // 검색어 데이터
  try {
    //2. postService.list에서 글 목록과 페이지네이터를 가져옴
    const [posts, paginator] = await postService.list(collection, page, search);
    //3. 리스트 페이지 렌더링
    res.render("home", { title: "테스트 게시판", search, paginator, posts });
  } catch (error) {
    console.error(error);
    res.render("home", { title: "테스트 게시판" });
    // 4. 에러가 나는 경우는 빈 값으로 테더링
  }
});

// 1. 쓰기 페이지 이동, mode는 create
// 쓰기 페이지 이동 시에 create의 값을 가진 mode 변수를 추가했습니다.
app.get("/write", (req, res) => {
  res.render("write", { title: "테스트 게시판", mode: "create" });
});

// 2. 수정 페이지로 이동 mode는 modify
// 상세페이지로 이동 시에 사용하는 API입니다
app.get("/modify/:id", async (req, res) => {
  // 3. getPostById() 함수로 게시글 데이터를 받아옴
  // mode 값은 modify이며 이전에 postService에 만들어준 getPostById()함수를 사용합니다.
  const post = await postService.getPostById(collection, req.params.id);
  console.log(post);
  res.render("write", { title: "테스트 게시판", mode: "modify", post });
});

// 4. 게시글 수정 API
// 게시글 수정 API는 /modify/ url로 POST 요청이 오는 경우 실행합니다. 요청의 body에서 아이디(id), 제목(title), 이름(writer), 본문(content)를 받아서 post객체로 만든 다음 id값과 함께 넙깁니다.
app.post("/modify/", async (req, res) => {
  const { id, title, writer, password, content } = req.body;

  const post = {
    title,
    writer,
    password,
    content,
    createDt: new Date().toISOString(),
  };
  // 5. 업데이트 결과
  // 업데이트가 잘되었는지 결과를 반환합니다. 예제에서는 실패 시 처리가 되어있지 않습니다. try catch로 감싸서 문제가 발생한 경우 적절한 처리를 하도록 추가하는 것이 좋습니다.
  // 수정이 성공적으로 된다면 상세페이지로 리다이렉트합니다.
  const result = postService.updatePost(collection, id, post);
  res.redirect(`/detail/${id}`);
});

app.delete("/delete", async (req, res) => {
  const { id, password } = req.body;
  try {
    // 1. collection의 deleteOne을 사용해 게시글 하나를 삭제
    // deleteOne() 함수는 조건에 맞는 도큐먼트를 하나 삭제합니다. deleteOne() 함수의 결과는 DeleteResult 객체인데, acknowledged는 삭제가 승인이 되었는지 여부를 알려줍니다.
    // deletedCount(숫자 타입) 값을 가지고 있습니다. acknowledged는 삭제 승인이 되었는지 여부를 알려줍니다. deleteCount는 삭제한 도큐먼트 개수입니다. deleteOne()이라는 함수명에서 알 수 있듯이
    // 삭제 성공이면 값이 1이 됩니다. deleteOne() 함수는 콜백 방식과 async await 방식이 각각 있는데 후자를 사용했습니다.
    const result = await collection.deleteOne({
      _id: ObjectId(id),
      password: password,
    });
    // 2. 삭제 결과가 잘못된 경우의 처리
    // deleteOne()의 결과는 DeleteResult이고 삭제 성공이면 deletedCount값이 1이라고 했습니다. 1이 아니라면 실패했다는 뜻이므로 deletedCount값이 1이 아닌 경우 실패로 간주하고
    // isSuccess:false를 값으로 내려줍니다. 성공이면 당연하겠지만 isSuccess:true값을 내려줍니다.
    if (result.deletedCount !== 1) {
      console.log("삭제 실패");
      return res.json({ isSuccess: false });
    }
    return res.json({ isSuccess: true });
  } catch (error) {
    // 3. 에러가 난 경우의 처리
    // 데이터베이스 연결이 안되거나 네트워크가 불안정하는 등의 예외 상황이 있을 수 있으므로 try catch로 감싸주었습니다. 에러인 경우 isSuccess:false를 반환합니다.
    console.error(error);
    return res.json({ issuccess: false });
  }
});
// collection.deletOne() 부분도 post-service로 넣을 수 있습니다만, 함수가 한 줄밖에 되지 않아서 추가하지 않았습니다. 만약에 다른 곳에서 똑같은 코드를 재사용한다면 그때
// post-service.js로넣으면 됩니다. 여기까지 진행했으면 게시글 관련 코드 구현은 완료입니다. 다음으로 댓글 관련 코드입니다.

app.post("/write", async (req, res) => {
  const post = req.body; // 2. 글쓰기 후 결과 반환
  // writePost() 함수는 collection, post를 가각 매개변수로 받습니다. post에 저장된 내용을 몽고디비에 저장하고 결과를 반환합니다.

  const result = await postService.writePost(collection, post); // 생성된 도큐먼트의 _id를 사용해 상세페이지로 이동
  // 저장 결과에는 도큐먼트의 식별자로 사용할 수 있는 insertdId값이 있습니다. 해당값을 사용해 상세페이지로 이동합니다.

  res.redirect(`/detail/${result.insertedId}`);
});

//상세 페이지로 이동
app.get("/detail/:id", async (req, res) => {
  // 게시글 정보 가져오기

  const result = await postService.getDetailPost(collection, req.params.id);
  res.render("detail", {
    title: "테스트 게시판",
    post: result.value,
  });
});

// 1. id password 값을 가져옴
app.post("/check-password", async (req, res) => {
  const { id, password } = req.body;
  // post 요청이므로 req.body에서 id, password 데이터를 구조 분해 할당으로 각각 가져옵니다.

  // 2. postService의 getPostByIdAndPassword() 함수를 사용해 게시글 데이터 확인
  const post = await postService.getPostByIdAndPassword(collection, {
    id,
    password,
  });
  // postService에 있는 getPostByIdAndPassword에 collection, id, password를 넘기고 데이터를 ㅏㅂㄷ아옵니다.
  // 데이터가 있으면 isExist true, 없으면 isExist False
  if (!post) {
    return res.status(404).json({ isExist: false });
  } else {
    return res.json({ isExist: true });
  }
});

// 상세 페이지API는 단순하게 id 정보를 넘겨서 몽고디비에서 게시글의 데이터를 가져오면 된다.
// 데이터를 가져오는 부분에서는 postService에 getDetailPost() 함수로 추가합니다. 결괏값으로 ModifyResult 객체를 반환하는데
// lastErrorObject는 updatedExisting과 n이라는 이름의 속성을 가지고 있으며, 각각 업데이트된 문서가 있는지, 있다면 몇 개인지를 알려줍니다.
// ok는 boolean 타입의 속성으로 게시글 문서의 수정이 성공인지 실패인지를 알 수 있습니다. 게시글의 데이터는 value에 있으므로
// result.value를 템플릿에 넣어주면 됩니다.

// 댓글 추가
app.post("/write-comment", async (req, res) => {
  const { id, name, password, comment } = req.body; // 1. body에서 데이터를 가져오기
  const post = await postService.getPostById(collection, id);
  // 2. id로 게시글 정보 가져오기

  // 3게시글에 기존 댓글 리스트가 있으면 추가
  if (post.comments) {
    post.comments.push({
      idx: post.comments.length + 1,
      name,
      password,
      comment,
      createDt: new Date().toISOString(),
    });
  } else {
    // 4. 게시글에 댓글 정보가 없으면 리스트에 댓글 정보 추가
    post.comments = [
      {
        idx: 1,
        name,
        password,
        comment,
        createDt: new Date().toISOString(),
      },
    ];
  }
  //5. 업데이트하기. 업데이트 후에는 상세페이지로 다시 리다이렉트
  postService.updatePost(collection, id, post);
  return res.redirect(`/detail/${id}`);
});

// 댓글 삭제
app.delete("/delete-comment", async (req, res) => {
  const { id, idx, password } = req.body;

  const post = await collection.findOne(
    {
      _id: ObjectId(id),
      comments: { $elemMatch: { idx: parseInt(idx), password } },
    },
    postService.projectionOption
  );

  if (!post) {
    return res.json({ isSuccess: false });
  }

  post.comments = post.comments.filter((comment) => comment.idx != idx);
  postService.updatePost(collection, id, post);
  return res.json({ isSuccess: true });
});

let collection;
app.listen(3000, async () => {
  console.log("Server Started");

  const mongoClient = await mongodbConnection(); // ./configs/mongodb-connection에서 불러온 함수를 실행하면 mongoClient 객체를 받을 수있음

  collection = mongoClient.db("board").collection("post"); // db()를 사용해 데이터베이스를 선택하고 collection('post')를 사용해 컬렉션을 선택했습니다.
  console.log("MongoDB에 연결되었습니다!");
});

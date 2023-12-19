const { MongoClient } = require("mongodb");
// 몽고 디비 연결주소

const uri =
  "mongodb+srv://wjdxodus6224:jhj*970521@cluster0.kzflcvj.mongodb.net/?retryWrites=true&w=majority";

module.exports = function (callback) {
  return MongoClient.connect(uri, callback);
};

// 함수를 호출하는 사람이 몽고디비의 uri 값을 몰라도 사용할 수 있게 함수를 한번 감싼다. 함수의 결괏값으로 uri와 콜백 함수를 받는 Mongodb.connection()함수를 반환하다.

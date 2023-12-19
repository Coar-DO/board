module.exports = {
  lengthOfList: (list = []) => list.length, // 1. 리스트 길이를 반환
  eq: (var1, var2) => var1 === var2, // 2. 두값을 비교해보고 같은지 여부를 반환
  dataString: (isoString) => new Date(isoString).toLocaleDateString(), // 3. ISO 날짜 문자열에서 날짜만 반환
};

// 1. list.length를 사용해 리스트 길이를 반환합니다. handlebars에서 리스트 객체가 null인 경우 빈값이 나옵니다. 이 때 0을 표시하는데 필요하다.
// 2. equre의 약자로 eq를 사용했습니다.
// 3. 날짜시간을 저장합니다.

// 헬퍼 함수 사용시 에는 {{헬퍼 함수명 변수1 변수2 ---변수n}}과 같이 가장 처음에 함수명을 넣고 다음으로는 변수들을 빈칸으로 구분해주면 됩니다.
// 예시 : {{length0fList comments }}개의 댓글이 있습니다. / 작성일시 : {{dateStirng createDt}} }}

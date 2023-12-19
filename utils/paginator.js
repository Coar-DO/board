const lodash = require("lodash"); // 1. lodash 임포트
// 리스트 페이지 기획 시 페이지네이터 부분에 최대 1부터 10페이지까지 나오도록 했습니다. 이렇게 최대 10페이지가 나오도록 하려면
// 시작부터 끝 페이지까지의 숫자가 들어 있는 리스트를 만들어야 하는데, 이를 편리하게 만들 수 있도록 하는 함수가
// lodash.range() 함수입니다. lodash.range(1,11)을 실행하면 [1, ..., 10]으로 구성된 리스트가 반환됩니다.
// lodash를 사용하려면 설치가 필요합니다. 터미널에서 npm i lodash를 입력해 설치해줍니다.

const PAGE_LIST_SIZE = 10;
// 2. 최대 몇 개의 페이지를 보여줄지 설정
// => PAGE_LIST_SIZE는 리스트 페이지에서 최대 몇 개의 페이지를 보여줄지 정하는 변수입니다. 10페이지까지 기획했으니 10으로 설정했습니다.

// 3. 총 개수, 한 페이지에 표시하는 게시물 개수를 매개변수로 받음
module.exports = ({ totalCount, page, perPage = 10 }) => {
  const PER_PAGE = perPage;
  const totalPage = Math.ceil(totalCount / PER_PAGE);

  // 페이지네티어는 하나의 함수로 이러어져 있습니다. 변수로 게시물의 총 개수(totalCount), 현재 페이지(page), 한 페이지당 표시하는 게시물 개수(perPage)를 받습니다
  // 페이징할 때 몇 페이지까지 나올지 계산합니다. 게시물이 11개이고 페이지당 10개씩 보여주는 경우 2페이지가 되어야 하고, 나누어 떨어지는 경우(예를 들어 게시물 10개 페이지당 10개인 경우 1페이지)
  // 도 고려하를 하면 Math.ceil(totalCount / PER_PAGE)의 로직으로 총 페이지 수를 구할 수 있습니다.

  //시작 페이지 : 몫 * PAGE_LIST_SIZE + 1
  let quotient = parseInt(page / PAGE_LIST_SIZE); // 4. 총 페이지 계산
  if (page % PAGE_LIST_SIZE === 0) {
    quotient -= 1;
  }
  const startPage = quotient * PAGE_LIST_SIZE + 1; // 5. 시작 페이지 구하기
  // 시작 페이지를 구하는 로직입니다. 시작 페이지는 현재 페이지를 PAGE_LIST_SIZE로 나눈 몫에 +1을 해주면 됩니다. 값이 나누어 떨어지는 경우 몫에 -1을 해줍니다. 현재 페이지가 1페이지이고
  // 한화면에 10페이지가 나온다면 1/10의 몫은 0이므로 +1을 해 1페이지가 시작 페이지입니다. 만약 현재 페이지가 10페이지라면 10/10은 나누어떨어지므로 몫인 1에서 -1을 한 후 다시 +1을 해
  // 1페이지가 시작 페이지입니다.

  // 끝 페이지 : startPage + PAGE_LIST_SIZE -1
  const endPage =
    startPage + PAGE_LIST_SIZE - 1 < totalPage
      ? startPage + PAGE_LIST_SIZE - 1
      : totalPage;

  // 6. 끝 페이지 구하기
  const isFirstPage = page === 1;
  const isLastPage = page === totalPage;
  const hasPrev = page > 1;
  const hasNext = page < totalPage;
  const paginator = {
    // 끝 페이지는 구하기 쉽습니다. 시작 페이지 + PAGE_LIST_SIZE를 한다음 -1을 해주면 됩니다. 구한 값이 totalPage보다 크다면 totalPage가 마지막 페이지가 됩니다.

    // 7.표시할 페이지 번호 리스트를 만들어줌
    pageList: lodash.range(startPage, endPage + 1),
    page,
    prevPage: page - 1,
    nextPage: page + 1,
    startPage,
    lastPage: totalPage,
    hasPrev,
    hasNext,
    isFirstPage,
    isLastPage,
  };
  return paginator;
};
// 1에서 설명드린 lodash.range()함수로 각페이지의 값을 담고 있는 리스트를 만들어줍니다.

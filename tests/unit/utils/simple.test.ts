/**
 * 간단한 테스트로 Jest 설정 확인
 */

describe('Simple Test', () => {
  test('Jest가 정상적으로 작동해야 함', () => {
    expect(1 + 1).toBe(2);
  });

  test('문자열 연산이 정상적으로 작동해야 함', () => {
    const result = '테스트' + ' ' + '성공';
    expect(result).toBe('테스트 성공');
  });
});
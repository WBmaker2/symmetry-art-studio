type LearningPanelProps = {
  activityMessage: string;
};

export function LearningPanel({ activityMessage }: LearningPanelProps) {
  return (
    <aside className="learning-panel" aria-label="수업 관찰 질문">
      <section>
        <h2>성취기준 연결</h2>
        <dl className="standard-list">
          <div>
            <dt>[6수03-03]</dt>
            <dd>선대칭도형과 점대칭도형의 성질을 탐구하고 설명합니다.</dd>
          </div>
          <div>
            <dt>[6미02-02]</dt>
            <dd>데칼코마니처럼 다양한 발상 방법으로 아이디어를 발전시킵니다.</dd>
          </div>
        </dl>
      </section>

      <section>
        <h2>관찰 질문</h2>
        <ul>
          <li>원래 선과 반사된 선은 대칭축에서 같은 거리에 있나요?</li>
          <li>대칭축을 바꾸면 그림의 느낌과 규칙이 어떻게 달라지나요?</li>
          <li>지우개도 대칭으로 작동할 때 어떤 수학 성질을 볼 수 있나요?</li>
        </ul>
      </section>

      <section>
        <h2>현재 작업</h2>
        <p>{activityMessage}</p>
      </section>
    </aside>
  );
}

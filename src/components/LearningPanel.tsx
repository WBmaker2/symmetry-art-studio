import type { AxisMode } from '../domain/symmetry';

type LearningPanelProps = {
  activityMessage: string;
  visitedAxes: AxisMode[];
};

export function LearningPanel({
  activityMessage,
  visitedAxes,
}: LearningPanelProps) {
  const missions = [
    {
      id: 'vertical',
      label: '세로축으로 시작 선 그리기',
      complete: visitedAxes.includes('vertical'),
    },
    {
      id: 'horizontal',
      label: '가로축으로 위아래 반사 비교하기',
      complete: visitedAxes.includes('horizontal'),
    },
    {
      id: 'diagonal',
      label: '대각선축으로 방향 변화 관찰하기',
      complete: visitedAxes.includes('diagonal'),
    },
    {
      id: 'compare',
      label: '세 축 비교하기',
      complete: visitedAxes.length === 3,
    },
  ] as const;

  return (
    <aside className="learning-panel" aria-label="수업 관찰 질문">
      <section>
        <h2>성취기준 연결</h2>
        <dl className="standard-list">
          <div>
            <dt>[6수03-02]</dt>
            <dd>
              실생활과 연결하여 선대칭도형과 점대칭도형을 이해하고 그릴 수 있습니다.
            </dd>
          </div>
          <div>
            <dt>[6미02-02]</dt>
            <dd>
              디지털 매체 등 다양한 표현 재료와 용구를 탐색하여 작품 제작에 활용할 수 있습니다.
            </dd>
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
        <h2>수업 미션</h2>
        <ul className="mission-list">
          {missions.map((mission) => {
            const statusText = mission.complete ? '완료' : '진행 중';
            return (
              <li
                key={mission.id}
                className={`mission-item ${mission.complete ? 'complete' : ''}`}
                aria-label={`${mission.label} ${statusText}`}
              >
                <span aria-hidden="true">{mission.complete ? '✓' : '◻︎'}</span>
                <span>{mission.label}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h2>현재 작업</h2>
        <p>{activityMessage}</p>
      </section>
    </aside>
  );
}

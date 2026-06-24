# 08_UI_DESIGN_GUIDE.md

# PaperPlane UI Design Guide

## 디자인 목표

PaperPlane의 UI는 창작자가 자신의 이야기를 해외 독자에게 가볍고 빠르게 날려 보내는 느낌을 전달해야 한다.

서비스의 핵심 이미지는 다음과 같다.

* 종이비행기
* 흰 종이
* 하늘
* 바람
* 가벼운 이동
* 언어를 넘어 전달되는 이야기
* 창작자와 독자를 연결하는 부드러운 경험

초기 MVP는 복잡한 관리자 도구처럼 보이면 안 된다.
창작자에게는 신뢰감 있는 작업 공간으로, 독자에게는 편안한 독서 공간으로 느껴져야 한다.

## 브랜드 키워드

* Light
* Airy
* Clear
* Global
* Story-driven
* Soft Tech
* Creator Friendly

한국어 키워드로는 다음 느낌을 우선한다.

* 가벼움
* 투명함
* 시원함
* 설렘
* 연결
* 신뢰
* 창작자 친화적

## 메인 캐치프레이즈

랜딩 페이지 히어로 섹션에는 다음 문구를 반드시 포함한다.

> 언어가 달라져도, 이야기가 주는 설렘은 같아야 한다

이 문구는 PaperPlane의 핵심 메시지이다.
단순히 번역 기능을 제공하는 서비스가 아니라, 작품이 가진 감정과 설렘을 다른 언어권 독자에게 전달하는 서비스라는 점을 보여준다.

## 랜딩 페이지 히어로 카피

### 메인 카피

```txt
언어가 달라져도,
이야기가 주는 설렘은 같아야 한다
```

### 서브 카피 예시

```txt
PaperPlane은 창작자의 이야기를 AI로 번역하고,
해외 독자가 바로 읽을 수 있는 뷰어와 반응 확인 기능을 제공합니다.
```

### CTA 버튼 예시

* 지금 작품 업로드하기
* 번역 작품 보기
* 해외 독자 반응 확인하기

초기 MVP에서는 CTA를 1개 또는 2개만 사용한다.

권장 구성:

* Primary CTA: 지금 작품 업로드하기
* Secondary CTA: 샘플 작품 보기

## 컬러 시스템

PaperPlane은 흰색을 기본 배경으로 사용하고, 청록색과 하늘색을 메인 포인트 컬러로 사용한다.

### Primary Colors

```css
--color-primary: #22C7C7;
--color-primary-dark: #0891B2;
--color-primary-light: #A7F3F0;
```

### Sky Colors

```css
--color-sky: #38BDF8;
--color-sky-soft: #E0F7FF;
--color-sky-pale: #F0FAFF;
```

### Neutral Colors

```css
--color-white: #FFFFFF;
--color-background: #F8FDFF;
--color-surface: #FFFFFF;
--color-border: #D8EEF5;
--color-text-main: #102A43;
--color-text-sub: #627D98;
--color-text-muted: #9FB3C8;
```

### Accent Colors

```css
--color-success: #10B981;
--color-warning: #F59E0B;
--color-error: #EF4444;
```

## Tailwind 색상 예시

Tailwind 설정에 다음 색상을 반영한다.

```ts
colors: {
  paper: {
    white: "#FFFFFF",
    background: "#F8FDFF",
    surface: "#FFFFFF",
    border: "#D8EEF5",
  },
  plane: {
    primary: "#22C7C7",
    dark: "#0891B2",
    light: "#A7F3F0",
  },
  sky: {
    DEFAULT: "#38BDF8",
    soft: "#E0F7FF",
    pale: "#F0FAFF",
  },
  ink: {
    main: "#102A43",
    sub: "#627D98",
    muted: "#9FB3C8",
  },
}
```

## 전체 레이아웃 톤

### 기본 배경

전체 페이지의 기본 배경은 완전한 회색이 아니라 아주 옅은 하늘색이 섞인 흰색을 사용한다.

권장 배경:

```css
background: linear-gradient(180deg, #F0FAFF 0%, #FFFFFF 45%, #F8FDFF 100%);
```

### 카드 UI

작품 카드, 대시보드 카드, 업로드 폼은 흰색 카드를 사용한다.

권장 스타일:

```css
background: #FFFFFF;
border: 1px solid #D8EEF5;
border-radius: 20px;
box-shadow: 0 12px 30px rgba(8, 145, 178, 0.08);
```

카드는 너무 무겁지 않아야 한다.
그림자는 흐릿하고 가벼워야 한다.

## 시각적 모티프

PaperPlane 이름을 살려 다음 요소를 UI 곳곳에 사용할 수 있다.

### 사용 가능한 모티프

* 작은 종이비행기 아이콘
* 점선 비행 경로
* 부드러운 구름 형태의 배경 장식
* 얇은 곡선 라인
* 카드가 살짝 떠 있는 듯한 그림자
* 번역 완료 시 종이비행기가 날아가는 듯한 애니메이션

### 주의할 점

* 너무 유치한 일러스트 느낌은 피한다.
* 종이비행기 아이콘을 과하게 반복하지 않는다.
* 서비스가 장난감처럼 보이지 않게 한다.
* 창작자 도구로서의 신뢰감을 유지한다.

## 타이포그래피

### 한글 폰트

권장:

* Pretendard
* Noto Sans KR

### 영문 폰트

권장:

* Inter
* Pretendard

### 제목 스타일

랜딩 페이지의 메인 문구는 감성적이지만 또렷하게 보여야 한다.

권장 스타일:

```css
font-size: 56px;
line-height: 1.15;
font-weight: 800;
letter-spacing: -0.04em;
color: #102A43;
```

모바일에서는 다음 정도로 줄인다.

```css
font-size: 36px;
line-height: 1.2;
```

### 본문 스타일

```css
font-size: 16px;
line-height: 1.7;
color: #627D98;
```

독자 뷰어의 본문은 더 읽기 편하게 설정한다.

```css
font-size: 18px;
line-height: 1.9;
color: #102A43;
```

## 버튼 스타일

### Primary Button

주요 CTA 버튼이다.

예시:

* 지금 작품 업로드하기
* 번역 시작하기
* 작품 공개하기

스타일:

```css
background: linear-gradient(135deg, #22C7C7 0%, #38BDF8 100%);
color: #FFFFFF;
border-radius: 999px;
padding: 14px 24px;
font-weight: 700;
box-shadow: 0 10px 24px rgba(34, 199, 199, 0.24);
```

### Secondary Button

보조 버튼이다.

예시:

* 샘플 작품 보기
* 공개 링크 복사
* 다시 번역하기

스타일:

```css
background: #FFFFFF;
color: #0891B2;
border: 1px solid #A7F3F0;
border-radius: 999px;
padding: 14px 24px;
font-weight: 700;
```

## 랜딩 페이지 구성

랜딩 페이지는 다음 순서로 구성한다.

```txt
1. Header
2. Hero Section
3. Problem Section
4. Solution Section
5. How It Works Section
6. Creator Dashboard Preview
7. Reader Viewer Preview
8. CTA Section
```

## 랜딩 페이지 상세 요구사항

### 1. Header

포함 요소:

* PaperPlane 로고
* 로그인
* 시작하기 버튼

로고는 텍스트 로고로 시작해도 된다.

예시:

```txt
✈ PaperPlane
```

또는 종이비행기 아이콘과 PaperPlane 텍스트를 조합한다.

### 2. Hero Section

히어로 섹션에는 반드시 캐치프레이즈를 포함한다.

```txt
언어가 달라져도,
이야기가 주는 설렘은 같아야 한다
```

히어로 섹션의 시각적 방향:

* 왼쪽: 카피와 CTA
* 오른쪽: 종이비행기가 원고에서 해외 독자에게 날아가는 느낌의 카드 UI
* 배경: 옅은 하늘색 그라데이션
* 장식: 점선 비행 경로

### 3. Problem Section

창작자의 문제를 간단히 보여준다.

예시 문구:

```txt
좋은 이야기가 있어도 해외 독자에게 닿기까지는 번역, 검수, 플랫폼 등록, 홍보라는 높은 장벽이 있습니다.
```

카드 예시:

* 번역 비용 부담
* 해외 독자 반응 확인 어려움
* 작품 발견 경로 부족

### 4. Solution Section

PaperPlane이 제공하는 해결책을 보여준다.

카드 예시:

* 작품 업로드
* AI 자동 번역
* 공개 뷰어 생성
* 독자 유입 확인
* 댓글 반응 수집

### 5. How It Works Section

3단계로 단순하게 보여준다.

```txt
1. 작품을 업로드합니다.
2. AI가 번역본을 생성합니다.
3. 공개 링크로 해외 독자 반응을 확인합니다.
```

### 6. Creator Dashboard Preview

창작자 대시보드 미리보기 카드 UI를 배치한다.

보여줄 지표:

* 전체 조회수
* 오늘 조회수
* 댓글 수
* 주요 유입 경로
* 최근 댓글

### 7. Reader Viewer Preview

독자가 읽는 화면을 미리 보여준다.

구성:

* 작품 제목
* 번역된 본문
* 댓글 영역
* 모바일 뷰어 느낌

독자 뷰어는 특히 깔끔하고 가독성이 좋아야 한다.

### 8. CTA Section

마지막 CTA는 감성적인 문구와 함께 배치한다.

예시:

```txt
당신의 이야기를 더 먼 곳의 독자에게 보내보세요.
```

버튼:

```txt
첫 작품 업로드하기
```

## 창작자 대시보드 디자인

대시보드는 복잡한 분석 툴처럼 보이지 않게 한다.
창작자가 가장 궁금해할 정보를 우선 보여준다.

### 상단 요약 카드

* 전체 조회수
* 오늘 조회수
* 전체 댓글 수
* 공개 작품 수

### 작품별 카드

각 작품 카드는 다음 정보를 포함한다.

* 작품 제목
* 공개 여부
* 번역 상태
* 조회수
* 댓글 수
* 공개 링크 복사 버튼

### 번역 상태 뱃지

```txt
대기 중
번역 중
번역 완료
번역 실패
```

색상:

* 대기 중: 회색
* 번역 중: 하늘색
* 번역 완료: 청록색
* 번역 실패: 빨간색

## 작품 업로드 페이지 디자인

업로드 페이지는 단계형 폼처럼 구성한다.

권장 단계:

```txt
1. 작품 정보 입력
2. 원문 텍스트 입력
3. 번역 언어 선택
4. 번역 시작
```

입력 폼은 넓고 여유롭게 배치한다.
창작자가 긴 텍스트를 붙여넣어도 답답하지 않아야 한다.

## 독자 뷰어 디자인

독자 뷰어는 가장 간결해야 한다.

### 원칙

* 본문 가독성 최우선
* 불필요한 UI 제거
* 모바일 대응 필수
* 댓글은 본문 아래 배치
* 창작자 대시보드 느낌과 분리

### 뷰어 레이아웃

```txt
작품 제목
작품 소개
번역 언어 표시
본문
댓글 영역
```

### 본문 영역

권장 스타일:

```css
max-width: 720px;
margin: 0 auto;
font-size: 18px;
line-height: 1.9;
color: #102A43;
```

## 컴포넌트 디자인 규칙

### Card

```tsx
className="
  rounded-3xl
  border
  border-sky-100
  bg-white
  shadow-[0_12px_30px_rgba(8,145,178,0.08)]
"
```

### Primary Button

```tsx
className="
  rounded-full
  bg-gradient-to-r
  from-teal-400
  to-sky-400
  px-6
  py-3
  font-bold
  text-white
  shadow-lg
  shadow-teal-200/50
  transition
  hover:-translate-y-0.5
  hover:shadow-xl
"
```

### Secondary Button

```tsx
className="
  rounded-full
  border
  border-teal-100
  bg-white
  px-6
  py-3
  font-bold
  text-cyan-700
  transition
  hover:bg-sky-50
"
```

### Input

```tsx
className="
  rounded-2xl
  border
  border-sky-100
  bg-white
  px-4
  py-3
  text-slate-800
  outline-none
  transition
  focus:border-cyan-400
  focus:ring-4
  focus:ring-cyan-100
"
```

## 애니메이션 방향

애니메이션은 가볍고 부드러워야 한다.

사용 가능:

* 버튼 hover 시 살짝 위로 이동
* 카드 hover 시 그림자 증가
* 종이비행기 아이콘이 천천히 이동
* 번역 진행 중 점선 경로 애니메이션
* 페이지 진입 시 fade-up

주의:

* 과한 회전 효과 금지
* 빠른 움직임 금지
* 사용자의 읽기 흐름을 방해하는 애니메이션 금지

## 반응형 디자인

초기 MVP는 모바일에서도 반드시 정상적으로 보여야 한다.

### 기준

* 375px 모바일 화면 지원
* 768px 태블릿 화면 지원
* 1024px 이상 데스크톱 화면 지원

### 모바일 우선순위

* 랜딩 히어로 카피가 잘 보여야 한다.
* 업로드 폼이 세로로 자연스럽게 배치되어야 한다.
* 독자 뷰어 본문이 읽기 편해야 한다.
* 대시보드 지표 카드는 1열 또는 2열로 정리한다.

## 금지 사항

* 어두운 다크모드 중심 디자인 금지
* 과한 보라색/분홍색 사용 금지
* 무거운 관리자 페이지 스타일 금지
* 너무 많은 그래프 사용 금지
* 종이비행기 일러스트 과다 사용 금지
* 텍스트 가독성을 해치는 연한 색상 사용 금지
* CTA 버튼을 3개 이상 나열하지 않기

## 최종 디자인 방향 요약

PaperPlane의 UI는 다음 문장으로 요약된다.

```txt
흰 종이 위에 이야기를 적고, 청록빛 하늘을 따라 해외 독자에게 가볍게 날려 보내는 서비스
```

따라서 모든 화면은 흰색, 청록색, 하늘색을 중심으로 구성하고, 창작자의 작품이 해외 독자에게 자연스럽게 전달되는 느낌을 주어야 한다.

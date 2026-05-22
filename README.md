# QRQR

연극 발표용 랜덤 채팅 관객 반응 페이지입니다. 앱 이름은 `대나무 숲`입니다.

## GitHub Pages 배포

1. 이 폴더를 GitHub 저장소에 올립니다.
2. 저장소 `Settings` -> `Pages`에서 배포 소스를 `main` 브랜치의 root로 설정합니다.
3. 발급된 GitHub Pages 주소를 발표 화면에서 엽니다.
4. GitHub Pages 주소 자체가 관객용 `index.html`입니다. 이 주소를 QR로 만들면 학생들이 바로 `대나무 숲` 채팅 화면으로 들어갑니다.

## 동작 방식

- 서버 없이 `index.html`, `app.js`, `styles.css`만으로 관객 화면이 동작합니다.
- `audience.html`은 예전 주소 호환용이며 `index.html`로 이동합니다.
- 학생들이 QR을 스캔하면 미리 입력된 채팅이 자동으로 올라옵니다.
- 관객은 채팅을 작성할 수 없고 공개된 배우 메시지에만 `좋아요`, `싫어요`, `슬픔`, `놀람` 반응을 선택할 수 있습니다.
- GitHub Pages 정적 페이지만으로는 여러 학생의 반응을 한 화면에 실시간 합산할 수 없습니다. 합산이 필요하면 Firebase, Supabase, 또는 별도 WebSocket 서버가 필요합니다.

## 로컬 미리보기

GitHub Pages 배포 전 확인이 필요하면 다음 명령으로 정적 미리보기 서버를 실행할 수 있습니다.

```bash
npm start
```

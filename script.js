// 세로↔가로 전환 시 화면 높이를 바로바로 다시 계산
function setAppHeight() {
  const h = window.visualViewport ? window.visualViewport.height : window.innerHeight;
  document.documentElement.style.setProperty('--app-h', h + 'px');
  const vw = document.querySelector('.video-wrap');
  if (vw) document.documentElement.style.setProperty('--video-w', vw.getBoundingClientRect().width + 'px');
}
function refreshLayout() {
  setAppHeight();
  // 일부 브라우저는 회전 직후 크기가 늦게 바뀌어서 몇 번 더 확인
  [50, 150, 300, 600].forEach(t => setTimeout(setAppHeight, t));
}
setAppHeight();
window.addEventListener('load', setAppHeight);
window.addEventListener('resize', refreshLayout);
window.addEventListener('orientationchange', refreshLayout);
if (window.visualViewport) window.visualViewport.addEventListener('resize', setAppHeight);
if (screen.orientation) screen.orientation.addEventListener('change', refreshLayout);

const video = document.querySelector('.video-wrap video');
const playBtn = document.querySelector('.play-btn');
const isTouch = matchMedia('(hover: none) and (pointer: coarse)').matches;
const isLandscape = () => matchMedia('(orientation: landscape)').matches;
const isFull = () => document.fullscreenElement || document.webkitFullscreenElement || video.webkitDisplayingFullscreen;

// 모바일 가로 화면이면 전체화면으로
function goFullscreen() {
  if (!isTouch || !isLandscape() || isFull()) return;
  try {
    if (video.requestFullscreen) {
      video.requestFullscreen().catch(() => {});
    } else if (video.webkitEnterFullscreen) {
      video.webkitEnterFullscreen();   // 아이폰
    }
  } catch (e) {}
}

// 가운데 재생 버튼
playBtn.addEventListener('click', () => {
  playBtn.hidden = true;
  video.controls = true;
  video.play();
  goFullscreen();
});

// 세로로 돌아오면 전체화면을 닫고 세로 페이지로
function exitFullscreen() {
  try {
    if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
    else if (document.webkitFullscreenElement && document.webkitExitFullscreen) document.webkitExitFullscreen();
    else if (video.webkitDisplayingFullscreen && video.webkitExitFullscreen) video.webkitExitFullscreen();
  } catch (e) {}
}
function onRotate() {
  if (!isTouch) return;
  if (isLandscape()) { if (!video.paused) goFullscreen(); }
  else if (isFull()) { exitFullscreen(); }
  refreshLayout();
}
window.addEventListener('orientationchange', () => setTimeout(onRotate, 150));
if (screen.orientation) screen.orientation.addEventListener('change', () => setTimeout(onRotate, 150));
document.addEventListener('fullscreenchange', refreshLayout);
video.addEventListener('webkitendfullscreen', refreshLayout);   // 아이폰 전체화면 종료

// 재생 컨트롤로 다시 재생할 때도 가로면 전체화면
video.addEventListener('play', () => {
  playBtn.hidden = true;
  video.controls = true;
  goFullscreen();
});
// 턴어라운드 팝업
(() => {
  const modal = document.querySelector('.turn-modal');
  const imgs = [...modal.querySelectorAll('.turn-frame img')];
  const tabs = [...modal.querySelectorAll('.turn-tabs button')];
  let cur = 0;
  function show(i) {
    cur = (i + imgs.length) % imgs.length;
    imgs.forEach((im, k) => im.classList.toggle('on', k === cur));
    tabs.forEach((t, k) => t.classList.toggle('on', k === cur));
  }
  function open() { show(0); modal.classList.add('open'); document.body.style.overflow = 'hidden'; }
  function close() { modal.classList.remove('open'); document.body.style.overflow = ''; }
  document.querySelector('.turn-btn').addEventListener('click', open);
  modal.querySelector('.turn-close').addEventListener('click', close);
  modal.querySelector('.turn-prev').addEventListener('click', () => show(cur - 1));
  modal.querySelector('.turn-next').addEventListener('click', () => show(cur + 1));
  tabs.forEach((t, k) => t.addEventListener('click', () => show(k)));
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  document.addEventListener('keydown', e => {
    if (!modal.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(cur - 1);
    if (e.key === 'ArrowRight') show(cur + 1);
  });
  // 휴대폰: 좌우로 밀어서 넘기기
  let x0 = null;
  const frame = modal.querySelector('.turn-frame');
  frame.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
  frame.addEventListener('touchend', e => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 40) show(cur + (dx < 0 ? 1 : -1));
    x0 = null;
  });
})();

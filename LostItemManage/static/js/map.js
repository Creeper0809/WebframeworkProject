import { showDetail } from './detailPanel.js';
import { getItems } from './itemApi.js';

// 모듈(파일) 최상단에 전역 변수 선언
let map = null;
let currentUserId = null;
const markers = [];

export function initMap(userId) {
  // currentUserId 전역 변수에 할당
  currentUserId = userId;

  kakao.maps.load(async () => {
    // map 전역 변수에 할당
    map = new kakao.maps.Map(
      document.getElementById('map'),
      {
        center: new kakao.maps.LatLng(33.450701, 126.570667),
        level: 3,
        disableDoubleClickZoom: true
      }
    );

    // 전역 함수로 노출 (필요하다면 그대로 공개)
    window.showDetail = showDetail;
    window.createMarker = createMarker; // 이제 createMarker는 전역에서 map, currentUserId를 직접 참조

    // 기존 아이템 마커 생성
    const items = await getItems();
    items.forEach(item => createMarker(item));

    // 더블 클릭으로 신규 등록 (로그인 사용자만)
    if (currentUserId) {
      let tempMarker;
      kakao.maps.event.addListener(map, 'dblclick', e => {
        const coord = e.latLng;
        console.log(coord.getLat());
        if (!tempMarker) {
          tempMarker = new kakao.maps.Marker({ map });
        }
        tempMarker.setPosition(coord);
        document.getElementById('latitude').value = coord.getLat();
        document.getElementById('longitude').value = coord.getLng();
        document.getElementById('lost-item-form')?.classList.remove('hidden');
        document.getElementById('lost-item-detail')?.classList.add('hidden');
      });
    }
  });
}

function  createMarker(item) {
  // 전역 map, currentUserId를 직접 사용
  const pos = new kakao.maps.LatLng(item.latitude, item.longitude);
  const markerOptions = { position: pos, map };
  if (item.user_id === currentUserId) {
    markerOptions.image = new kakao.maps.MarkerImage(
      'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png',
      new kakao.maps.Size(24, 35)
    );
  }
  const marker = new kakao.maps.Marker(markerOptions);
  markers.push(marker);

  kakao.maps.event.addListener(marker, 'click', async () => {
    try {
      const res = await fetch(`/item/${item.id}/`);
      const detail = await res.json();
      detail.comments = detail.comments || [];
      showDetail(detail);
    } catch (err) {
      console.error('아이템 상세 로드 실패:', err);
      showDetail(item);
    }
  });
}

export function clearAllMarkers() {
  for (const marker of markers) {
    marker.setMap(null); // 맵에서 제거
  }
  markers.length = 0; // 배열 비우기
}

export async function fetchAndRenderItems(category = '', q = '') {
  try {
    // ① 쿼리스트링 만들기 (둘 다 비어 있으면 그냥 /item/)
    let url = '/item/';
    const params = new URLSearchParams();
    if (q)        params.append('q', q);
    if (category) params.append('category', category);
    const queryString = params.toString();
    if (queryString) url = `/item/?${queryString}`;

    const res = await fetch(url, {
      method: 'GET',
      credentials: 'include'
    });
    if (!res.ok) {
      const err = await res.json();
      console.error('아이템 로드 실패:', err.error || res.status);
      return;
    }

    const items = await res.json();
    // 전역 map, currentUserId를 사용하는 createMarker 호출
    clearAllMarkers();
    items.forEach(item => createMarker(item));
  } catch (error) {
    console.error('서버 통신 중 오류:', error);
  }
}

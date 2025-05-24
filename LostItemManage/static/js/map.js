import { showDetail } from './detailPanel.js';
import { getItems } from './itemApi.js';

export function initMap(currentUserId) {
  kakao.maps.load(async () => {
    const map = new kakao.maps.Map(
      document.getElementById('map'),
      {
        center: new kakao.maps.LatLng(33.450701, 126.570667),
        level: 3,
        disableDoubleClickZoom: true
      }
    );

    // 전역 함수로 노출
    window.showDetail = showDetail;
    window.createMarker = item => createMarker(item, map, currentUserId);

    // 기존 아이템 마커 생성
    const items = await getItems();
    items.forEach(item => window.createMarker(item));

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

function createMarker(item, map, currentUserId) {
  const pos = new kakao.maps.LatLng(item.latitude, item.longitude);
  const markerOptions = { position: pos, map };
  if (item.user_id === currentUserId) {
    markerOptions.image = new kakao.maps.MarkerImage(
      'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png',
      new kakao.maps.Size(24, 35)
    );
  }
  const marker = new kakao.maps.Marker(markerOptions);

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

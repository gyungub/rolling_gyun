// ========== 상태 관리 ==========
let collection = {}; // 도감: { 캐릭터이름: true }
let inventory = {};  // 가방: { 캐릭터이름: 보유개수 }
let autoRollInterval = null;

// ========== 로컬스토리지 ==========
function saveData() {
  localStorage.setItem('gyun_collection', JSON.stringify(collection));
  localStorage.setItem('gyun_inventory', JSON.stringify(inventory));
}

function loadData() {
  const savedCollection = localStorage.getItem('gyun_collection');
  const savedInventory = localStorage.getItem('gyun_inventory');
  if (savedCollection) collection = JSON.parse(savedCollection);
  if (savedInventory) inventory = JSON.parse(savedInventory);
}

// ========== 확률 계산 ==========
function getRandomCharacter() {
  // 전체 확률 합계 계산
  const totalChance = characters.reduce((sum, c) => sum + c.chance, 0);
  
  // 0 ~ totalChance 사이의 랜덤 값
  let random = Math.random() * totalChance;
  
  // 누적 확률로 캐릭터 선택
  for (const char of characters) {
    random -= char.chance;
    if (random <= 0) {
      return char;
    }
  }
  
  // 혹시 모를 경우 마지막 캐릭터 반환
  return characters[characters.length - 1];
}

// ========== 뽑기 ==========
function pull() {
  const char = getRandomCharacter();
  
  // 도감 및 가방 업데이트
  collection[char.name] = true;
  inventory[char.name] = (inventory[char.name] || 0) + 1;
  saveData();
  
  // 결과 표시
  displayResult(char);
  
  // 패널 열려있으면 업데이트
  if (document.getElementById('collection').style.display === 'block') {
    renderCollection();
  }
  if (document.getElementById('inventory').style.display === 'block') {
    renderInventory();
  }
}

function displayResult(char) {
  const resultDiv = document.getElementById('result');
  resultDiv.innerHTML = `
    <span class="grade-${char.grade}">
      【${char.grade}】 ${char.name}
    </span>
  `;
}

// ========== 오토롤 ==========
function startAutoRoll() {
  if (autoRollInterval) return; // 이미 실행 중이면 무시
  
  autoRollInterval = setInterval(() => {
    pull();
  }, 10000000000000000000000000000000); // 0.1초마다 뽑기
}

function stopAutoRoll() {
  if (autoRollInterval) {
    clearInterval(autoRollInterval);
    autoRollInterval = null;
  }
}

// ========== 도감 ==========
function toggleCollection() {
  const panel = document.getElementById('collection');
  const inventoryPanel = document.getElementById('inventory');
  
  // 가방 패널 닫기
  inventoryPanel.style.display = 'none';
  
  if (panel.style.display === 'block') {
    panel.style.display = 'none';
  } else {
    panel.style.display = 'block';
    renderCollection();
  }
}

function renderCollection() {
  const listDiv = document.getElementById('collection-list');
  
  // 등급 순서 정의
  const gradeOrder = ['시크릿', '초월', '전설', '신화', '에픽', '초희귀', '희귀', '일반'];
  
  // 등급별로 정렬
  const sortedChars = [...characters].sort((a, b) => {
    return gradeOrder.indexOf(a.grade) - gradeOrder.indexOf(b.grade);
  });
  
  let html = '';
  for (const char of sortedChars) {
    const obtained = collection[char.name];
    
    // 시크릿 등급이고 보유 중이면 컷씬 버튼 추가
    let cutsceneBtn = '';
    if (obtained && char.grade === '시크릿') {
      // 캐릭터 이름에 따라 다른 컷씬 함수 호출
      if (char.name.includes('Abyssal') || char.name.includes('심연')) {
        cutsceneBtn = `<button class="cutscene-btn" onclick="secretCutsceneEffect()">컷씬</button>`;
      } else if (char.name.includes('Lord') || char.name.includes('Depths')) {
        cutsceneBtn = `<button class="cutscene-btn" onclick="lordOfDepthsCutscene()">컷씬</button>`;
      } else {
        // 기본 시크릿 컷씬
        cutsceneBtn = `<button class="cutscene-btn" onclick="secretCutsceneEffect()">컷씬</button>`;
      }
    }
    
    html += `
      <div class="char-entry grade-${char.grade}">
        <span>
          <strong class="grade-${char.grade}">【${char.grade}】</strong> 
          ${obtained ? char.name : '???'}
        </span>
        <div class="char-entry-right">
          ${cutsceneBtn}
          <span class="${obtained ? 'obtained' : 'not-obtained'}">
            ${obtained ? '보유' : '미보유'}
          </span>
        </div>
      </div>
    `;
  }
  
  // 도감 달성률 계산
  const totalCount = characters.length;
  const obtainedCount = Object.keys(collection).length;
  const percentage = ((Object.keys(collection).length / 100) * 100).toFixed(1);
  listDiv.innerHTML = `
    <p style="margin-bottom: 15px; color: #ffd700;">
      달성률: ${obtainedCount}/${totalCount} (${percentage}%)
    </p>
    ${html}
  `;
}

// ========== 가방 ==========
function toggleInventory() {
  const panel = document.getElementById('inventory');
  const collectionPanel = document.getElementById('collection');
  
  // 도감 패널 닫기
  collectionPanel.style.display = 'none';
  
  if (panel.style.display === 'block') {
    panel.style.display = 'none';
  } else {
    panel.style.display = 'block';
    renderInventory();
  }
}

function renderInventory() {
  const listDiv = document.getElementById('inventory-list');
  
  // 등급 순서 정의
  const gradeOrder = ['시크릿', '초월', '전설', '신화', '에픽', '초희귀', '희귀', '일반'];
  
  // 보유한 캐릭터만 필터링 후 등급순 정렬
  const ownedChars = characters
    .filter(c => inventory[c.name] > 0)
    .sort((a, b) => gradeOrder.indexOf(a.grade) - gradeOrder.indexOf(b.grade));
  
  if (ownedChars.length === 0) {
    listDiv.innerHTML = '<p style="color: rgba(255,255,255,0.5);">아직 보유한 캐릭터가 없습니다.</p>';
    return;
  }
  
  // 총 보유 개수
  const totalOwned = Object.values(inventory).reduce((sum, count) => sum + count, 0);
  
  let html = `<p style="margin-bottom: 15px; color: #ffd700;">총 보유: ${totalOwned}개</p>`;
  
  for (const char of ownedChars) {
    const count = inventory[char.name];
    html += `
      <div class="char-entry grade-${char.grade}">
        <span>
          <strong class="grade-${char.grade}">【${char.grade}】</strong> 
          ${char.name}
        </span>
        <span style="color: #4ade80;">
          ${count}개
        </span>
      </div>
    `;
  }
  
  listDiv.innerHTML = html;
}

// ========== 컷씬 (나중에 구현) ==========
function closeCutscene() {
  document.getElementById('cutscene').classList.remove('show');
}

// ========== 초기화 ==========
window.addEventListener('DOMContentLoaded', () => {
  loadData();
});

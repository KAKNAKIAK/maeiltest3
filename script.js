// ----- 전역 변수 및 초기화 함수 -----
let quoteGroupCounter = 0;
let quoteGroupDataStore = {};
let activeGroupIndex = -1; // 현재 활성화된 탭의 인덱스

const travelEmojis = [
    { value: "", display: "아이콘 없음" }, { value: "✈️", display: "✈️ 항공" }, { value: "🏨", display: "🏨 숙소" }, { value: "🍽️", display: "🍽️ 식사" }, { value: "🏛️", display: "🏛️ 관광(실내)" }, { value: "🏞️", display: "🏞️ 관광(야외)" }, { value: "🚶", display: "🚶 이동(도보)" }, { value: "🚌", display: "🚌 이동(버스)" }, { value: "🚆", display: "🚆 이동(기차)" }, { value: "🚢", display: "🚢 이동(배)" }, { value: "🚕", display: "🚕 이동(택시)" }, { value: "🛍️", display: "🛍️ 쇼핑" }, { value: "📷", display: "📷 사진촬영" }, { value: "🗺️", display: "🗺️ 계획/지도" }, { value: "📌", display: "📌 중요장소" }, { value: "☕", display: "☕ 카페/휴식" }, { value: "🎭", display: "🎭 공연/문화" }, { value: "💼", display: "💼 업무" }, { value: "ℹ️", display: "ℹ️ 정보" }
];

let currentGroupIndexForLoad = null;
let currentDayIndexForLoad = null;

// ----- 유틸리티 함수 -----
function generateId() { return 'id_' + Math.random().toString(36).substr(2, 9); }
function formatDateForDisplay(dateString, dayNumber) {
    try {
        if (!isValidYyyyMmDd(String(dateString))) {
            console.warn(`[formatDateForDisplay] Invalid YYYY-MM-DD format for DAY ${dayNumber}: '${dateString}'`);
            return `DAY ${dayNumber}: 날짜 형식 오류 (값: ${dateString})`;
        }
        const parts = String(dateString).split('-');
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const date = new Date(year, month, day);
        if (isNaN(date.getTime()) || date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
            console.warn(`[formatDateForDisplay] Date object construction failed for DAY ${dayNumber}. Input: '${dateString}'`);
            return `DAY ${dayNumber}: 날짜 변환 오류 (값: ${dateString})`;
        }
        const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
        return `DAY ${dayNumber}: ${date.toLocaleDateString('ko-KR', options)}`;
    } catch (e) {
        console.error(`[formatDateForDisplay] Error for DAY ${dayNumber}, dateString: '${dateString}'`, e);
        return `DAY ${dayNumber}: 날짜 처리 예외`;
    }
}
function formatTimeToHHMM(timeStr) {
    if (timeStr && timeStr.length === 4 && /^\d{4}$/.test(timeStr)) {
        const hours = timeStr.substring(0, 2);
        const minutes = timeStr.substring(2, 4);
        if (parseInt(hours, 10) >= 0 && parseInt(hours, 10) <= 23 &&
            parseInt(minutes, 10) >= 0 && parseInt(minutes, 10) <= 59) {
            return `${hours}:${minutes}`;
        }
    }
    return "";
}
function dateToYyyyMmDd(date) {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let dayVal = '' + d.getDate();
    const year = d.getFullYear();
    if (month.length < 2) month = '0' + month;
    if (dayVal.length < 2) dayVal = '0' + dayVal;
    return [year, month, dayVal].join('-');
}
function showToast(message, duration = 3000, isError = false) {
    const toastElement = document.getElementById('toast');
    if (toastElement) {
        toastElement.textContent = message;
        toastElement.style.backgroundColor = isError ? '#dc3545' : '#333';
        toastElement.classList.add('show');
        setTimeout(() => {
            toastElement.classList.remove('show');
        }, duration);
    }
}

const quoteGroupBorderColors = ['#4A90E2', '#50E3C2', '#F5A623', '#BD10E0', '#7ED321', '#D0021B', '#417505', '#9013FE'];
let currentBorderColorIndex = 0;

// --- 탭 관련 함수 ---
function activateTab(groupIndexToActivate) {
    // 모든 탭 버튼 비활성화
    document.querySelectorAll('#quoteTabButtonsContainer .quote-tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    // 모든 탭 패널 숨기기
    document.querySelectorAll('#quoteGroupsContainer .quote-group-section').forEach(panel => {
        panel.classList.remove('active');
    });

    const groupIndexStr = String(groupIndexToActivate);

    // 특정 탭 버튼 활성화
    const tabButton = document.querySelector(`#quoteTabButtonsContainer .quote-tab-button[data-group-index="${groupIndexStr}"]`);
    if (tabButton) {
        tabButton.classList.add('active');
    }
    // 특정 탭 패널 보이기
    const tabPanel = document.getElementById(`quoteGroup_${groupIndexStr}`);
    if (tabPanel) {
        tabPanel.classList.add('active');
         // SortableJS가 있는 경우, 탭 활성화 시 refresh (DOM이 visible 상태가 되어야 정확한 계산 가능)
        const daysHost = tabPanel.querySelector(`#daysContainerStatic_${groupIndexStr}`);
        if (daysHost && typeof Sortable !== 'undefined' && daysHost.sortableInstance) {
            // Sortable.get(daysHost)?.option('disabled', false); // 예시. 필요시 사용
        }
        tabPanel.querySelectorAll('.activities-list').forEach(list => {
            if (list && typeof Sortable !== 'undefined' && list.sortableInstance) {
                // Sortable.get(list)?.option('disabled', false); // 예시. 필요시 사용
            }
        });
    }
    activeGroupIndex = parseInt(groupIndexStr);
}

function updateTabTitle(groupIndex, newTitle) {
    const tabButtonTitleSpan = document.querySelector(`#quoteTabButtonsContainer .quote-tab-button[data-group-index="${groupIndex}"] .tab-title`);
    if (tabButtonTitleSpan) {
        tabButtonTitleSpan.textContent = newTitle || `견적 ${parseInt(groupIndex) + 1}`;
    }
}

function handleDeleteQuoteGroup(groupIndexToDelete) {
    const groupData = quoteGroupDataStore[groupIndexToDelete];
    const groupTitle = groupData ? groupData.groupTitle : `견적 ${parseInt(groupIndexToDelete) + 1}`;
    if (!window.confirm(`'${groupTitle}' 그룹을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
        return;
    }

    // DOM에서 탭 버튼과 패널 제거
    const tabButton = document.querySelector(`#quoteTabButtonsContainer .quote-tab-button[data-group-index="${groupIndexToDelete}"]`);
    if (tabButton) tabButton.remove();
    const tabPanel = document.getElementById(`quoteGroup_${groupIndexToDelete}`);
    if (tabPanel) tabPanel.remove();

    // 데이터 저장소에서 삭제
    delete quoteGroupDataStore[groupIndexToDelete];

    // 다른 탭 활성화 로직
    if (activeGroupIndex === parseInt(groupIndexToDelete)) {
        const remainingTabButtons = document.querySelectorAll('#quoteTabButtonsContainer .quote-tab-button');
        if (remainingTabButtons.length > 0) {
            // 삭제된 탭의 인덱스를 기준으로 이전 탭 또는 첫 번째 탭 활성화 시도
            let newIndexToActivate = -1;
            let prevButton = null;
            remainingTabButtons.forEach(btn => {
                if (parseInt(btn.dataset.groupIndex) < parseInt(groupIndexToDelete)) {
                    prevButton = btn; // 가장 가까운 이전 탭 (마지막으로 찾은 것)
                }
            });

            if (prevButton) {
                newIndexToActivate = parseInt(prevButton.dataset.groupIndex);
            } else { // 이전 탭이 없으면 첫 번째 탭 활성화
                newIndexToActivate = parseInt(remainingTabButtons[0].dataset.groupIndex);
            }
            activateTab(newIndexToActivate);
        } else {
            activeGroupIndex = -1; // 활성 탭 없음
        }
    }
    // 만약 삭제된 탭이 현재 활성 탭이 아니었다면, 현재 활성 탭은 그대로 유지됨.
}


// `createQuoteGroup` 함수 수정
function createQuoteGroup(groupIndex, afterElement = null /* 사용 안함 */, sourceGroupData = null) {
    const groupId = `quoteGroup_${groupIndex}`;
    const quoteGroupDiv = document.createElement('div');
    // 클래스명에 active는 activateTab 함수에서 관리
    quoteGroupDiv.className = 'quote-group-section'; 
    quoteGroupDiv.id = groupId;
    quoteGroupDiv.dataset.groupIndex = groupIndex;

    let borderColorToApply = sourceGroupData?.borderColor || quoteGroupBorderColors[currentBorderColorIndex];
    quoteGroupDiv.style.borderColor = borderColorToApply;
    if (!sourceGroupData) { // 새 그룹 생성 시에만 색상 인덱스 증가 (복사 시에는 sourceGroupData.borderColor 사용)
         currentBorderColorIndex = (currentBorderColorIndex + 1) % quoteGroupBorderColors.length;
    }

    quoteGroupDataStore[groupIndex] = sourceGroupData || {
        groupTitle: `견적 ${parseInt(groupIndex) + 1}`, // 기본 탭 제목
        borderColor: borderColorToApply,
        priceSubgroups: [],
        inclusionExclusion: { includedTextarea: '', excludedTextarea: '' },
        flightSubgroups: [],
        itinerarySummaryRows: [],
        detailedItinerary: { title: "여행 일정표", days: [] }
    };
    // ... (데이터 복원 시 상세 일정 관련 ID 재생성 및 기본값 설정 등은 기존 로직 유지)
     if (sourceGroupData && !quoteGroupDataStore[groupIndex].detailedItinerary) {
        quoteGroupDataStore[groupIndex].detailedItinerary = { title: "여행 일정표", days: [] };
    }
     if (sourceGroupData && typeof quoteGroupDataStore[groupIndex].detailedItinerary.title === 'undefined') {
        quoteGroupDataStore[groupIndex].detailedItinerary.title = "여행 일정표";
    }
     if (sourceGroupData && !sourceGroupData.flightSubgroups) {
        quoteGroupDataStore[groupIndex].flightSubgroups = [];
    }
     if (sourceGroupData && !sourceGroupData.priceSubgroups) {
        quoteGroupDataStore[groupIndex].priceSubgroups = [];
    }
    if (sourceGroupData && !sourceGroupData.itinerarySummaryRows) {
        quoteGroupDataStore[groupIndex].itinerarySummaryRows = [];
    }

    quoteGroupDiv.innerHTML = `
        <div class="group-action-buttons">
            <button type="button" class="copy-quote-group-btn" title="이 견적 그룹 복사"><i class="fas fa-copy mr-1"></i>그룹 복사</button>
            <button type="button" class="delete-quote-group-btn" title="이 견적 그룹 삭제 (탭의 X와 동일)"><i class="fas fa-trash-alt mr-1"></i>그룹 삭제</button>
        </div>
        <input type="text" name="quote_group_title[${groupIndex}]" class="group-title-input" placeholder="견적 그룹 제목 (예: 1. 대한항공 + 신라 모노그램 다낭 슈페리어)" value="${quoteGroupDataStore[groupIndex].groupTitle}">
        
        <section class="mb-8 price-section-wrapper">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold bg-custom-orange p-2 rounded" style="flex-grow: 1;">요금 안내</h3>
                <button type="button" class="add-price-subgroup-button bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition text-xs ml-2" data-group-index="${groupIndex}">
                    <i class="fas fa-plus mr-1"></i> 요금 소그룹 추가
                </button>
            </div>
            <div id="priceSectionsContainer_${groupIndex}" class="price-sections-container-for-group"></div>
        </section>

        <section class="mb-8 inclusion-exclusion-section-wrapper">
            <h3 class="text-lg font-semibold mb-4 bg-custom-orange p-2 rounded">포함/불포함 사항</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="bg-gray-50 p-4 rounded">
                    <h4 class="text-md font-medium mb-2">포함</h4>
                    <textarea name="included_items_textarea[${groupIndex}]" rows="5" class="w-full px-3 py-2 border rounded focus:outline-none focus:border-custom-orange text-sm" placeholder="* 유류할증료, 제세공과금 포함...">${quoteGroupDataStore[groupIndex].inclusionExclusion.includedTextarea}</textarea>
                </div>
                <div class="bg-gray-50 p-4 rounded">
                    <h4 class="text-md font-medium mb-2">불포함</h4>
                    <textarea name="excluded_items_textarea[${groupIndex}]" rows="5" class="w-full px-3 py-2 border rounded focus:outline-none focus:border-custom-orange text-sm" placeholder="● 현지 개인 경비...">${quoteGroupDataStore[groupIndex].inclusionExclusion.excludedTextarea}</textarea>
                </div>
            </div>
        </section>

        <section class="mb-8 flight-schedule-section-wrapper">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold bg-custom-orange p-2 rounded" style="flex-grow: 1;">항공 스케줄</h3>
                <button type="button" class="add-flight-subgroup-button bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition text-xs ml-2" data-group-index="${groupIndex}">
                    <i class="fas fa-plus mr-1"></i> 항공 스케줄 소그룹 추가
                </button>
            </div>
            <div id="flightScheduleGroupsContainer_${groupIndex}" class="flight-schedule-groups-container-for-group"></div>
        </section>

        <section class="mb-8 itinerary-summary-section-wrapper">
            <h3 class="text-lg font-semibold mb-4 bg-custom-orange p-2 rounded">간단일정</h3>
            <div class="overflow-x-auto">
                <table class="min-w-full bg-white border text-sm">
                    <thead><tr class="bg-gray-100">
                        <th class="border p-2 text-left text-xs" style="width: 8%;">일수</th><th class="border p-2 text-left text-xs">날짜</th>
                        <th class="border p-2 text-left text-xs">출발지</th><th class="border p-2 text-left text-xs">도착지</th>
                        <th class="border p-2 text-left text-xs">숙박</th><th class="border p-2 text-left text-xs">이동</th>
                        <th class="border p-2 text-left text-xs">비고</th><th class="border p-2 text-center w-12 text-xs">삭제</th></tr></thead>
                    <tbody id="itineraryTableBody_${groupIndex}" class="itinerary-table-body-for-group"></tbody>
                    <tfoot><tr><td colspan="8" class="border p-2"><button type="button" class="add-itinerary-row-to-group bg-custom-green text-white px-2 py-1 rounded hover:bg-opacity-90 transition text-xs" data-group-index="${groupIndex}"><i class="fas fa-plus mr-1"></i> 행 추가</button></td></tr></tfoot>
                </table>
            </div>
        </section>

        <section class="mb-8 itinerary-detail-section-wrapper">
            <div class="flex justify-between items-center mb-2 bg-custom-orange p-2 rounded-t-md">
                <h3 class="text-lg font-semibold">상품일정 상세 (일정표)</h3>
                <div class="itinerary-planner-styles flex items-center space-x-1">
                     <button type="button" class="action-button-sm save-detailed-itinerary-html-btn" style="background-color: #fdba74;" title="이 그룹 일정 HTML로 저장" data-group-index="${groupIndex}"><i class="fas fa-file-code"></i><span class="hidden sm:inline">일정 HTML 저장</span></button>
                     <button type="button" class="action-button-sm load-detailed-itinerary-html-btn" style="background-color: #FACC15;" title="HTML 파일에서 이 그룹 일정 불러오기" data-group-index="${groupIndex}"><i class="fas fa-upload"></i><span class="hidden sm:inline">HTML 불러오기</span></button>
                     <button type="button" class="action-button-sm load-detailed-itinerary-excel-btn" style="background-color: #22C55E;" title="엑셀 파일에서 이 그룹 일정 불러오기" data-group-index="${groupIndex}"><i class="fas fa-file-excel"></i><span class="hidden sm:inline">엑셀 불러오기</span></button>
                </div>
            </div>
            <div id="detailedItineraryContainer_${groupIndex}" class="itinerary-planner-styles p-4 border border-t-0 border-gray-200 rounded-b-md bg-gray-100" style="min-height: 150px;">
                <input type="text" class="w-full px-3 py-2 border rounded focus:outline-none focus:border-custom-orange text-sm mb-2" name="detailed_itinerary_title[${groupIndex}]" placeholder="상세 일정표 제목 (예: 즐거운 다낭 3박 5일)" value="${quoteGroupDataStore[groupIndex].detailedItinerary.title || '여행 일정표'}">
                <div id="daysContainerStatic_${groupIndex}"></div>
                <div class="add-day-button-container mt-4 text-center">
                     <button type="button" class="add-detailed-itinerary-day-button action-button-sm bg-indigo-500 text-white hover:bg-indigo-600" data-group-index="${groupIndex}">
                        <i class="fas fa-plus"></i> 새 날짜 추가
                    </button>
                </div>
            </div>
        </section>
    `;

    const quoteGroupsContainer = document.getElementById('quoteGroupsContainer');
    quoteGroupsContainer.appendChild(quoteGroupDiv);

    // 탭 버튼 생성
    const tabButton = document.createElement('button');
    tabButton.type = 'button';
    tabButton.className = 'quote-tab-button';
    tabButton.dataset.groupIndex = groupIndex;
    tabButton.style.borderTopColor = borderColorToApply; // 탭 상단에 그룹 색상 표시
    tabButton.style.borderTopWidth = '3px';
    tabButton.style.borderTopStyle = 'solid';
    
    tabButton.innerHTML = `<span class="tab-title">${quoteGroupDataStore[groupIndex].groupTitle}</span>`;
    
    const deleteIcon = document.createElement('i');
    deleteIcon.className = 'fas fa-times tab-delete-icon';
    deleteIcon.title = '이 견적 그룹 삭제';
    deleteIcon.addEventListener('click', (e) => {
        e.stopPropagation(); // 탭 활성화 방지
        handleDeleteQuoteGroup(groupIndex);
    });
    tabButton.appendChild(deleteIcon);

    tabButton.addEventListener('click', () => activateTab(groupIndex));

    const quoteTabButtonsContainer = document.getElementById('quoteTabButtonsContainer');
    const addBtn = document.getElementById('addGlobalQuoteGroupBtn'); // "새 그룹 추가" 버튼
    quoteTabButtonsContainer.insertBefore(tabButton, addBtn); // "새 그룹 추가" 버튼 앞에 새 탭 삽입

    // 그룹 제목 입력 필드와 탭 제목 동기화
    const titleInput = quoteGroupDiv.querySelector(`input[name="quote_group_title[${groupIndex}]"]`);
    if (titleInput) {
        titleInput.addEventListener('input', (e) => {
            const newTitle = e.target.value;
            quoteGroupDataStore[groupIndex].groupTitle = newTitle;
            updateTabTitle(groupIndex, newTitle);
        });
    }
    
    // 내부 섹션들 초기화 (initPriceSectionForGroup 등)
    initPriceSectionForGroup(quoteGroupDiv, groupIndex, quoteGroupDataStore[groupIndex].priceSubgroups);
    initFlightScheduleForGroup(quoteGroupDiv, groupIndex, quoteGroupDataStore[groupIndex].flightSubgroups);
    initInclusionExclusionForGroup(quoteGroupDiv, groupIndex, quoteGroupDataStore[groupIndex]);
    initItinerarySummaryForGroup(quoteGroupDiv, groupIndex, quoteGroupDataStore[groupIndex].itinerarySummaryRows);
    renderDetailedItineraryForGroup(groupIndex);

    if (!sourceGroupData) { // 새 그룹 추가 시에만 (데이터 로드 시에는 restoreEditorFromData에서 처리)
        activateTab(groupIndex);
    }
    return quoteGroupDiv;
}

function renderDetailedItineraryForGroup(groupIndex) {
    const groupData = quoteGroupDataStore[groupIndex]; if (!groupData) { console.error(`Group data not found for groupIndex: ${groupIndex}`); return; }
    if (!groupData.detailedItinerary) { groupData.detailedItinerary = { title: "여행 일정표", days: [] }; console.log(`Initialized missing detailedItinerary for group ${groupIndex}`); }
    if (!Array.isArray(groupData.detailedItinerary.days)) { groupData.detailedItinerary.days = []; console.log(`Initialized missing or invalid detailedItinerary.days to [] for group ${groupIndex}`);}

    const container = document.getElementById(`detailedItineraryContainer_${groupIndex}`);
    if (!container) { console.error(`Detailed itinerary container not found for group ${groupIndex}`); return; }

    let daysHost = container.querySelector(`#daysContainerStatic_${groupIndex}`);
    if (!daysHost) {
        daysHost = document.createElement('div'); daysHost.id = `daysContainerStatic_${groupIndex}`;
        const addDayButtonContainer = container.querySelector('.add-day-button-container');
        if (addDayButtonContainer) container.insertBefore(daysHost, addDayButtonContainer); else container.appendChild(daysHost);
    }
    daysHost.innerHTML = '';

    groupData.detailedItinerary.days.forEach((day, dayIdx) => {
        if (!day || typeof day.date === 'undefined') {
            console.warn(`[Render Group ${groupIndex}] Day object at index ${dayIdx} is invalid. Skipping. Day data:`, day);
            const tempDate = dateToYyyyMmDd(new Date());
            const daySection = document.createElement('div'); daySection.className = 'day-section'; daySection.dataset.dayIndex = dayIdx;
            daySection.innerHTML = `<div class="p-2 text-red-500">DAY ${dayIdx + 1}: 날짜 정보 오류 (임시: ${formatDateForDisplay(tempDate, dayIdx+1)}) </div>`;
            daysHost.appendChild(daySection); return;
        }

        const daySection = document.createElement('div'); daySection.className = 'day-section'; daySection.dataset.dayIndex = dayIdx;
        let dateDisplayHTML;
        if (day.editingDate) {
            dateDisplayHTML = `
                <input type="text" class="date-edit-input itinerary-planner-styles" value="${day.date}" placeholder="YYYY-MM-DD 또는 YYYYMMDD">
                <button class="icon-button save-detailed-date-button itinerary-planner-styles" data-group-index="${groupIndex}" data-day-index="${dayIdx}" title="날짜 저장"><i class="fas fa-save"></i></button>
                <button class="icon-button cancel-detailed-date-edit-button itinerary-planner-styles" data-group-index="${groupIndex}" data-day-index="${dayIdx}" title="취소"><i class="fas fa-times"></i></button>`;
        } else {
            dateDisplayHTML = `
                <h2 class="day-header-title">${formatDateForDisplay(day.date, dayIdx + 1)}</h2>
                <button class="icon-button edit-detailed-date-button ml-2 itinerary-planner-styles" title="날짜 수정" data-group-index="${groupIndex}" data-day-index="${dayIdx}"><i class="fas fa-pencil-alt"></i></button>`;
        }

        daySection.innerHTML = `
            <div class="day-header-container" style="cursor: grab;">
                <div class="day-header-main">${dateDisplayHTML}</div>
                <div class="day-header-controls">
                    <button class="icon-button save-detailed-day-html-btn itinerary-planner-styles" title="이 날짜 HTML로 저장" data-group-index="${groupIndex}" data-day-index="${dayIdx}"><i class="fas fa-file-alt"></i></button>
                    <button class="icon-button load-detailed-day-html-button itinerary-planner-styles" title="이 날짜에 HTML 덮어쓰기" data-group-index="${groupIndex}" data-day-index="${dayIdx}"><i class="fas fa-clipboard"></i></button>
                    <button class="icon-button delete-detailed-day-button itinerary-planner-styles" title="이 날짜 전체 삭제" data-group-index="${groupIndex}" data-day-index="${dayIdx}"><i class="fas fa-trash-alt"></i></button>
                    <button class="icon-button toggle-detailed-day-collapse-button itinerary-planner-styles" title="펼치기/접기" data-group-index="${groupIndex}" data-day-index="${dayIdx}">
                        <i class="fas ${day.isCollapsed ? 'fa-chevron-right' : 'fa-chevron-down'}"></i></button>
                </div>
            </div>
            <div class="day-content-wrapper ${day.isCollapsed ? 'hidden' : ''}">
                <div class="activities-list activities-list-group-${groupIndex}-day-${dayIdx} pt-3" data-group-index="${groupIndex}" data-day-index="${dayIdx}" style="min-height: 20px;"></div>
                <button class="add-activity-to-day-button mt-3 mb-2 action-button" data-group-index="${groupIndex}" data-day-index="${dayIdx}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> 이 날짜에 새 일정 추가
                </button>
            </div>`;
        daysHost.appendChild(daySection);
        renderDetailedActivitiesForDayInGroup(groupIndex, dayIdx);
    });

    if (daysHost && daysHost.children.length > 0) {
        if (daysHost.sortableInstance) daysHost.sortableInstance.destroy();
        daysHost.sortableInstance = new Sortable(daysHost, {
            animation: 150, handle: '.day-header-container', ghostClass: 'sortable-ghost', chosenClass: 'sortable-chosen',
            onEnd: function(evt) {
                const oldIndex = evt.oldDraggableIndex; const newIndex = evt.newDraggableIndex;
                if (oldIndex !== undefined && newIndex !== undefined && oldIndex !== newIndex) {
                    const movedDay = quoteGroupDataStore[groupIndex].detailedItinerary.days.splice(oldIndex, 1)[0];
                    quoteGroupDataStore[groupIndex].detailedItinerary.days.splice(newIndex, 0, movedDay);
                    recalculateAllDetailedDates(groupIndex, Math.min(oldIndex, newIndex));
                    renderDetailedItineraryForGroup(groupIndex);
                }
            }
        });
    }
}

function renderDetailedActivitiesForDayInGroup(groupIndex, dayIndex) {
    const groupData = quoteGroupDataStore[groupIndex];
    const day = groupData.detailedItinerary.days[dayIndex];
    const activitiesListContainer = document.querySelector(`.activities-list-group-${groupIndex}-day-${dayIndex}`);
    if (!day || !activitiesListContainer) { console.error(`Day data/container not found for group ${groupIndex}, day ${dayIndex}`); return; }
    activitiesListContainer.innerHTML = '';

    day.activities.forEach(activity => {
        const card = document.createElement('div'); card.className = 'activity-card'; card.dataset.activityId = activity.id; card.style.cursor = 'grab';
        let imageHTML = activity.imageUrl ? `<img src="${activity.imageUrl}" alt="${activity.title || '활동 이미지'}" class="card-image" onerror="this.style.display='none';">` : '';
        card.innerHTML = `
            <div class="card-time-icon-area">
                <div class="card-icon">${activity.icon || ''}</div><div class="card-time">${formatTimeToHHMM(activity.time)}</div></div>
            <div class="card-details-area">
                <div class="card-title">${activity.title || ''}</div>
                ${activity.description ? `<div class="card-description">${activity.description}</div>` : ''}
                ${imageHTML}
                ${activity.locationLink ? `<div class="card-location">📍 <a href="${activity.locationLink}" target="_blank" rel="noopener noreferrer">위치 보기</a></div>` : ''}
                ${activity.cost ? `<div class="card-cost">💰 ${activity.cost}</div>` : ''}
                ${activity.notes ? `<div class="card-notes">📝 ${activity.notes}</div>` : ''}</div>
            <div class="card-actions-direct">
                <button class="icon-button edit-activity-button itinerary-planner-styles" title="수정" data-group-index="${groupIndex}" data-day-index="${dayIndex}" data-activity-id="${activity.id}"><i class="fas fa-pencil-alt"></i></button>
                <button class="icon-button duplicate-activity-button itinerary-planner-styles" title="복제" data-group-index="${groupIndex}" data-day-index="${dayIndex}" data-activity-id="${activity.id}"><i class="fas fa-copy"></i></button>
                <button class="icon-button delete-activity-button itinerary-planner-styles" title="삭제" data-group-index="${groupIndex}" data-day-index="${dayIndex}" data-activity-id="${activity.id}"><i class="fas fa-trash-alt"></i></button></div>`;
        activitiesListContainer.appendChild(card);
    });

    if (activitiesListContainer && activitiesListContainer.children.length >= 0) { // Allow empty list to be sortable target
         if (activitiesListContainer.sortableInstance) activitiesListContainer.sortableInstance.destroy();
        activitiesListContainer.sortableInstance = new Sortable(activitiesListContainer, {
            group: `shared-activities-group-${groupIndex}`, animation: 150, handle: '.activity-card', ghostClass: 'sortable-ghost', chosenClass: 'sortable-chosen',
            onEnd: function(evt) {
                const fromDayIndex = parseInt(evt.from.dataset.dayIndex); const toDayIndex = parseInt(evt.to.dataset.dayIndex);
                const oldActivityIndex = evt.oldDraggableIndex; const newActivityIndex = evt.newDraggableIndex;
                if (oldActivityIndex !== undefined && newActivityIndex !== undefined) {
                    const movedActivity = quoteGroupDataStore[groupIndex].detailedItinerary.days[fromDayIndex].activities.splice(oldActivityIndex, 1)[0];
                    quoteGroupDataStore[groupIndex].detailedItinerary.days[toDayIndex].activities.splice(newActivityIndex, 0, movedActivity);
                    renderDetailedItineraryForGroup(groupIndex);
                }
            }
        });
    }
}

function handleAddDetailedItineraryDay(groupIndex) {
    const groupData = quoteGroupDataStore[groupIndex];
    if (!groupData || !groupData.detailedItinerary) { console.error(`Cannot add day: detailedItinerary data is missing for group ${groupIndex}`); return; }
    let newDate; const daysArray = groupData.detailedItinerary.days;
    if (daysArray.length > 0) {
        const lastDayObject = daysArray[daysArray.length - 1];
        if (lastDayObject && lastDayObject.date && isValidYyyyMmDd(lastDayObject.date)) {
            const lastDateStr = lastDayObject.date; const parts = lastDateStr.split('-');
            const year = parseInt(parts[0], 10); const monthVal = parseInt(parts[1], 10) - 1; const dayVal = parseInt(parts[2], 10);
            const lastDate = new Date(year, monthVal, dayVal);
            if (isNaN(lastDate.getTime())) { console.warn(`[handleAddDetailedItineraryDay] lastDate parsed as invalid. Defaulting to today.`); newDate = new Date(); }
            else { newDate = new Date(lastDate); newDate.setDate(lastDate.getDate() + 1); }
        } else { console.warn(`[handleAddDetailedItineraryDay] Last day's date invalid. Defaulting to today.`); newDate = new Date(); }
    } else { newDate = new Date(); }
    let newDayDateString = dateToYyyyMmDd(newDate);
    if (newDayDateString === "NaN-NaN-NaN") { console.error(`[handleAddDetailedItineraryDay] CRITICAL: newDayDateString is 'NaN-NaN-NaN'. Forcing to today.`); newDayDateString = dateToYyyyMmDd(new Date());}
    daysArray.push({ date: newDayDateString, activities: [], isCollapsed: false, editingDate: false });
    renderDetailedItineraryForGroup(groupIndex);
}

const activityModal = document.getElementById('activityModal');
const activityForm = document.getElementById('activityForm');
const modalTitle = document.getElementById('modalTitle');
const activityIconSelect = document.getElementById('activityIconSelect');
const currentQuoteGroupIndexInput = document.getElementById('currentQuoteGroupIndex');
const currentDayIndexInput = document.getElementById('currentDayIndex');
const currentActivityIdInput = document.getElementById('currentActivityId');

function populateIconDropdown() { activityIconSelect.innerHTML = ''; travelEmojis.forEach(emoji => { const option = document.createElement('option'); option.value = emoji.value; option.textContent = emoji.display; activityIconSelect.appendChild(option); });}
function openActivityModal(groupIndex, dayIndex, activityId = null) {
    currentQuoteGroupIndexInput.value = groupIndex; currentDayIndexInput.value = dayIndex; activityForm.reset(); populateIconDropdown();
    if (activityId) {
        modalTitle.textContent = '일정 수정'; currentActivityIdInput.value = activityId;
        const activity = quoteGroupDataStore[groupIndex].detailedItinerary.days[dayIndex].activities.find(act => act.id === activityId);
        if (activity) {
            document.getElementById('activityTimeInput').value = activity.time || ""; activityIconSelect.value = activity.icon || "";
            document.getElementById('activityTitle').value = activity.title || ""; document.getElementById('activityDescription').value = activity.description || "";
            document.getElementById('activityLocation').value = activity.locationLink || ""; document.getElementById('activityImageUrl').value = activity.imageUrl || "";
            document.getElementById('activityCost').value = activity.cost || ""; document.getElementById('activityNotes').value = activity.notes || "";
        }
    } else { modalTitle.textContent = '새 일정 추가'; currentActivityIdInput.value = ''; activityIconSelect.value = travelEmojis[0].value; }
    activityModal.style.display = 'flex';
}
function closeActivityModal() { activityModal.style.display = 'none';}
document.getElementById('cancelActivityModalButton').addEventListener('click', closeActivityModal);
activityForm.addEventListener('submit', function(event) {
    event.preventDefault();
    const groupIndex = currentQuoteGroupIndexInput.value; const dayIndex = parseInt(currentDayIndexInput.value); const activityId = currentActivityIdInput.value;
    const timeValue = document.getElementById('activityTimeInput').value.trim();
    if (timeValue && (timeValue.length !== 4 || !/^\d{4}$/.test(timeValue))) { showToast("시간은 HHMM 형식의 4자리 숫자로 입력하거나 비워두세요.", 3000, true); return; }
    if (timeValue.length === 4) { const hours = parseInt(timeValue.substring(0, 2), 10); const minutes = parseInt(timeValue.substring(2, 4), 10); if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) { showToast("유효하지 않은 시간입니다.", 3000, true); return; }}
    const activityData = { id: activityId || generateId(), time: timeValue, icon: activityIconSelect.value, title: document.getElementById('activityTitle').value, description: document.getElementById('activityDescription').value, locationLink: document.getElementById('activityLocation').value, imageUrl: document.getElementById('activityImageUrl').value, cost: document.getElementById('activityCost').value, notes: document.getElementById('activityNotes').value };
    const dayActivities = quoteGroupDataStore[groupIndex].detailedItinerary.days[dayIndex].activities;
    if (activityId) { const activityIndex = dayActivities.findIndex(act => act.id === activityId); if (activityIndex > -1) dayActivities[activityIndex] = activityData; }
    else { dayActivities.push(activityData); }
    renderDetailedItineraryForGroup(groupIndex); closeActivityModal();
});

function isValidYyyyMmDd(dateString) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false;
    const parts = dateString.split("-"); const year = parseInt(parts[0], 10); const month = parseInt(parts[1], 10); const day = parseInt(parts[2], 10);
    if (year < 1000 || year > 3000 || month === 0 || month > 12) return false;
    const testDate = new Date(year, month - 1, day);
    return (testDate.getFullYear() === year && testDate.getMonth() === month - 1 && testDate.getDate() === day);
}
function parseAndFormatDateInput(inputValue) {
    let dateStr = String(inputValue).trim().replace(/\./g, '-');
    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(dateStr)) { const parts = dateStr.split('-'); const year = parts[0]; const month = parts[1].padStart(2,'0'); const day = parts[2].padStart(2,'0'); const formatted = `${year}-${month}-${day}`; if (isValidYyyyMmDd(formatted)) return formatted; }
    if (/^\d{8}$/.test(dateStr)) { const year = dateStr.substring(0, 4); const month = dateStr.substring(4, 6); const day = dateStr.substring(6, 8); const formatted = `${year}-${month}-${day}`; if (isValidYyyyMmDd(formatted)) return formatted; }
    if (/^\d{6}$/.test(dateStr)) { const year = `20${dateStr.substring(0, 2)}`; const month = dateStr.substring(2, 4); const day = dateStr.substring(4, 6); const formatted = `${year}-${month}-${day}`; if (isValidYyyyMmDd(formatted)) return formatted; }
    return null;
}
function recalculateAllDetailedDates(groupIndex, startingDayIndex) {
    const daysArray = quoteGroupDataStore[groupIndex].detailedItinerary.days;
    if (daysArray.length > startingDayIndex && daysArray[startingDayIndex]) {
        const startDateString = daysArray[startingDayIndex].date;
        if (!startDateString || !isValidYyyyMmDd(startDateString)) { console.warn(`[recalculateAllDetailedDates] Invalid start date at index ${startingDayIndex}: '${startDateString}'. Aborting.`); return; }
        const parts = startDateString.split('-'); const year = parseInt(parts[0], 10); const month = parseInt(parts[1], 10) - 1; const day = parseInt(parts[2], 10);
        let currentDate = new Date(year, month, day);
        if (isNaN(currentDate.getTime())) { console.error(`[recalculateAllDetailedDates] Failed to create Date from '${startDateString}'. Aborting.`); return;}
        for (let i = startingDayIndex + 1; i < daysArray.length; i++) { if (daysArray[i]) { currentDate.setDate(currentDate.getDate() + 1); daysArray[i].date = dateToYyyyMmDd(currentDate);}}
    }
}
function handleEditDayDate(groupIndex, dayIndex) { quoteGroupDataStore[groupIndex].detailedItinerary.days[dayIndex].editingDate = true; renderDetailedItineraryForGroup(groupIndex); const inputField = document.querySelector(`#detailedItineraryContainer_${groupIndex} .day-section[data-day-index="${dayIndex}"] .date-edit-input`); if (inputField) { inputField.focus(); inputField.select(); }}
function handleSaveDayDate(groupIndex, dayIndex) {
    const inputField = document.querySelector(`#detailedItineraryContainer_${groupIndex} .day-section[data-day-index="${dayIndex}"] .date-edit-input`);
    if (inputField) {
        const validatedDate = parseAndFormatDateInput(inputField.value);
        if (validatedDate && isValidYyyyMmDd(validatedDate)) {
            quoteGroupDataStore[groupIndex].detailedItinerary.days[dayIndex].date = validatedDate;
            quoteGroupDataStore[groupIndex].detailedItinerary.days[dayIndex].editingDate = false;
            recalculateAllDetailedDates(groupIndex, dayIndex);
            renderDetailedItineraryForGroup(groupIndex);
        } else { showToast("잘못된 날짜 형식입니다. (YYYY-MM-DD 또는 YYYYMMDD)", 3000, true); }
    }
}
function handleCancelEditDayDate(groupIndex, dayIndex) { quoteGroupDataStore[groupIndex].detailedItinerary.days[dayIndex].editingDate = false; renderDetailedItineraryForGroup(groupIndex);}
function handleDeleteDetailedItineraryDay(groupIndex, dayIndex) {
    if (window.confirm(`DAY ${dayIndex + 1} 일정을 삭제하시겠습니까?`)) {
        quoteGroupDataStore[groupIndex].detailedItinerary.days.splice(dayIndex, 1);
        if (quoteGroupDataStore[groupIndex].detailedItinerary.days.length > 0) {
             if (dayIndex === 0 && quoteGroupDataStore[groupIndex].detailedItinerary.days.length > 0 && isValidYyyyMmDd(quoteGroupDataStore[groupIndex].detailedItinerary.days[0].date)) { recalculateAllDetailedDates(groupIndex, 0); }
             else if (dayIndex > 0 && isValidYyyyMmDd(quoteGroupDataStore[groupIndex].detailedItinerary.days[dayIndex -1].date) ) { recalculateAllDetailedDates(groupIndex, dayIndex -1 ); }
             else if (quoteGroupDataStore[groupIndex].detailedItinerary.days.length > 0 && isValidYyyyMmDd(quoteGroupDataStore[groupIndex].detailedItinerary.days[0].date)) { recalculateAllDetailedDates(groupIndex, 0); }
        }
        renderDetailedItineraryForGroup(groupIndex);
    }
}
function handleToggleDayCollapse(groupIndex, dayIndex) { const dayData = quoteGroupDataStore[groupIndex].detailedItinerary.days[dayIndex]; dayData.isCollapsed = !dayData.isCollapsed; renderDetailedItineraryForGroup(groupIndex); }
function handleDuplicateActivity(groupIndex, dayIndex, activityId) {
    const dayActivities = quoteGroupDataStore[groupIndex].detailedItinerary.days[dayIndex].activities;
    const activityToDuplicate = dayActivities.find(act => act.id === activityId);
    if (activityToDuplicate) { const newActivity = { ...activityToDuplicate, id: generateId(), title: `${activityToDuplicate.title} (복사본)` }; const originalIndex = dayActivities.findIndex(act => act.id === activityId); dayActivities.splice(originalIndex + 1, 0, newActivity); renderDetailedItineraryForGroup(groupIndex); }
}
function handleDeleteActivity(groupIndex, dayIndex, activityId) { if (window.confirm("이 활동을 삭제하시겠습니까?")) { const dayActivities = quoteGroupDataStore[groupIndex].detailedItinerary.days[dayIndex].activities; quoteGroupDataStore[groupIndex].detailedItinerary.days[dayIndex].activities = dayActivities.filter(act => act.id !== activityId); renderDetailedItineraryForGroup(groupIndex);}}

// --- HTML Generation and Saving ---
function generateReadOnlyHTMLViewForQuoteGroup(groupIndex) {
    const groupData = quoteGroupDataStore[groupIndex]; if (!groupData || !groupData.detailedItinerary) return "";
    const itineraryData = groupData.detailedItinerary; let daysHTML = '';
    itineraryData.days.forEach((day, dayIdx) => {
        let activitiesHTML = '';
        day.activities.forEach(activity => {
            const webImageStyle = "display: block !important; width: 240px !important; height: 160px !important; object-fit: cover !important; border-radius: 4px !important; margin-top: 8px !important; margin-bottom: 8px !important; background-color: #eee !important;";
            let imageHTML = activity.imageUrl 
                ? `<img src="${activity.imageUrl}" alt="${activity.title || '활동 이미지'}" class="card-image" style="${webImageStyle}" onerror="this.style.display='none';">` 
                : '';
            activitiesHTML += `
                <div class="readonly-activity-card">
                    <div class="card-time-icon-area">
                        ${activity.icon ? `<div class="card-icon">${activity.icon}</div>` : '<div class="card-icon" style="height: 28.8px;"></div>'}
                        <div class="card-time">${formatTimeToHHMM(activity.time)}</div></div>
                    <div class="card-details-area">
                        <div class="card-title">${activity.title || ''}</div>
                        ${activity.description ? `<div class="card-description">${activity.description}</div>` : ''} ${imageHTML}
                        ${activity.locationLink ? `<div class="card-location">📍 <a href="${activity.locationLink}" target="_blank" rel="noopener noreferrer">위치 보기</a></div>` : ''}
                        ${activity.cost ? `<div class="card-cost">💰 ${activity.cost}</div>` : ''}
                        ${activity.notes ? `<div class="card-notes">📝 ${activity.notes}</div>` : ''}</div></div>`;});
        const dayHeaderId = `day-header-readonly-trip-${groupIndex}-${dayIdx}`;
        const isDayCollapsedInSavedView = true; 

        // 아이콘 관련 변수들은 이제 필요 없으므로 주석 처리하거나 삭제해도 됩니다.
        // const collapsedStateIconSVG = `<svg ... </svg>`; 
        // const expandedStateIconSVG = `<svg ... </svg>`;
        // const initialIconHTML = isDayCollapsedInSavedView ? collapsedStateIconSVG : expandedStateIconSVG;
        
        daysHTML += `
            <div class="day-section bg-white shadow-sm rounded-md">
                <div class="day-header-container" id="${dayHeaderId}" onclick="toggleDayView(this)">
                    <div class="day-header-main"><h1 class="day-header-title">${formatDateForDisplay(day.date, dayIdx + 1)}</h1></div>
                
                </div>
                <div class="day-content-wrapper ${isDayCollapsedInSavedView ? 'hidden' : ''}">
                    <div class="activities-list pt-3">${activitiesHTML}</div>
                     <div class="text-right p-2 mt-2"><button type="button" class="readonly-collapse-button" onclick="document.getElementById('${dayHeaderId}').click(); event.stopPropagation();">일차 접기</button></div></div></div>`;
    });
    return `<header class="readonly-view-header"><h1>${itineraryData.title || '여행 일정표'}</h1></header><main class="readonly-main-content saved-html-view"><div id="daysContainerReadOnly_${groupIndex}">${daysHTML}</div></main>`;
}
function generateReadOnlyDayViewForQuoteGroup(groupIndex, dayIndex) {
    const groupData = quoteGroupDataStore[groupIndex]; if (!groupData || !groupData.detailedItinerary || !groupData.detailedItinerary.days[dayIndex]) return "";
    const dayData = groupData.detailedItinerary.days[dayIndex]; const dayNumberForView = dayIndex + 1; let activitiesHTML = '';
    dayData.activities.forEach(activity => {
        let imageHTML = activity.imageUrl ? `<img src="${activity.imageUrl}" alt="${activity.title || '활동 이미지'}" class="card-image" onerror="this.style.display='none';">` : '';
        activitiesHTML += `
            <div class="readonly-activity-card">
                <div class="card-time-icon-area">
                     ${activity.icon ? `<div class="card-icon">${activity.icon}</div>` : '<div class="card-icon" style="height: 28.8px;"></div>'}
                    <div class="card-time">${formatTimeToHHMM(activity.time)}</div></div>
                <div class="card-details-area">
                    <div class="card-title">${activity.title || ''}</div>
                    ${activity.description ? `<div class="card-description">${activity.description}</div>` : ''} ${imageHTML}
                    ${activity.locationLink ? `<div class="card-location">📍 <a href="${activity.locationLink}" target="_blank" rel="noopener noreferrer">위치 보기</a></div>` : ''}
                    ${activity.cost ? `<div class="card-cost">💰 ${activity.cost}</div>` : ''}
                    ${activity.notes ? `<div class="card-notes">📝 ${activity.notes}</div>` : ''}</div></div>`;});
    const dayHeaderId = `day-header-readonly-single-${groupIndex}-${dayIndex}`;
    return `<header class="readonly-view-header"><h1>DAY ${dayNumberForView} : ${new Date(dayData.date + 'T00:00:00').toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</h1></header><main class="readonly-main-content saved-html-view"><div class="day-section bg-white shadow-sm rounded-md"><div class="day-header-container" id="${dayHeaderId}"><div class="day-header-main"><h2 class="day-header-title">${formatDateForDisplay(dayData.date, dayNumberForView)}</h2></div></div><div class="day-content-wrapper"><div class="activities-list pt-3">${activitiesHTML}</div></div></div></main>`;
}
function handleSaveDetailedItineraryAsHtml(groupIndex) {
    const groupData = quoteGroupDataStore[groupIndex]; if (!groupData || !groupData.detailedItinerary) { showToast('저장할 상세 일정 데이터가 없습니다.', 3000, true); return; }
    const itineraryDataToSave = JSON.parse(JSON.stringify(groupData.detailedItinerary));
    itineraryDataToSave.days.forEach(day => day.isCollapsed = true); 
    const itineraryDataString = JSON.stringify(itineraryDataToSave); const safeItineraryDataString = itineraryDataString.replace(/<\/script>/g, '<\\/script>');
    const readOnlyViewHTML = generateReadOnlyHTMLViewForQuoteGroup(groupIndex); 
    let styles = ""; document.querySelectorAll('style').forEach(styleTag => { styles += styleTag.innerHTML; });
    const fontAwesomeLink = '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.2.1/css/all.min.css">';
    const tailwindCDN = '<link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">';
    const googleFontLink = '<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap" rel="stylesheet">';
    const htmlContent = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>견적그룹 상세일정: ${itineraryDataToSave.title || '일정표'}</title>${tailwindCDN}${fontAwesomeLink}${googleFontLink}<style>body { font-family: 'Noto Sans KR', sans-serif; background-color: #F8F9FA; }${styles}.saved-html-view .day-header-container[onclick] { cursor: pointer; }.saved-html-view .day-header-container[onclick]:hover { background-color: #f0f0f0; }</style></head><body class="text-gray-800 saved-html-view preview-mode">${readOnlyViewHTML}<script type="application/json" id="embeddedTripData">${safeItineraryDataString}<\/script><script>function toggleDayView(headerElement) { const contentWrapper = headerElement.nextElementSibling; const toggleButtonSpan = headerElement.querySelector('.day-toggle-button-static'); if (contentWrapper && toggleButtonSpan) { const isHidden = contentWrapper.classList.toggle('hidden'); const collapsedIconHTML = '<svg class="toggle-icon w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>'; const expandedIconHTML = '<svg class="toggle-icon w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>'; toggleButtonSpan.innerHTML = isHidden ? collapsedIconHTML : expandedIconHTML; } }<\/script></body></html>`;
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const groupTitle = groupData.groupTitle ? groupData.groupTitle.replace(/[^a-z0-9가-힣]/gi, '_') : `그룹${groupIndex}`;
    const fileName = `상세일정_${groupTitle}_${dateToYyyyMmDd(new Date())}.html`;
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = fileName;
    document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(link.href);
    showToast('상세 일정이 HTML 파일로 저장되었습니다.');
}
function handleSaveDetailedDayAsHtml(groupIndex, dayIndex) {
    const groupData = quoteGroupDataStore[groupIndex]; if (!groupData || !groupData.detailedItinerary || !groupData.detailedItinerary.days[dayIndex]) { showToast('저장할 날짜 데이터가 없습니다.', 3000, true); return; }
    const dayDataToSave = JSON.parse(JSON.stringify(groupData.detailedItinerary.days[dayIndex]));
    const dayDataString = JSON.stringify(dayDataToSave); const safeDayDataString = dayDataString.replace(/<\/script>/g, '<\\/script>');
    const readOnlyDayViewHTML = generateReadOnlyDayViewForQuoteGroup(groupIndex, dayIndex);
    let styles = ""; document.querySelectorAll('style').forEach(styleTag => { styles += styleTag.innerHTML; });
    const fontAwesomeLink = '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.2.1/css/all.min.css">';
    const tailwindCDN = '<link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">';
    const googleFontLink = '<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap" rel="stylesheet">';
    const htmlContent = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>DAY ${dayIndex + 1} 상세 (${dayDataToSave.date})</title>${tailwindCDN}${fontAwesomeLink}${googleFontLink}<style>body { font-family: 'Noto Sans KR', sans-serif; background-color: #F8F9FA; }${styles}.readonly-view-header h1 { font-size: 1.25rem; }/* .saved-html-view .day-content-wrapper { display: block !important; } */ .saved-html-view .itinerary-planner-styles .day-header-controls .day-toggle-button-static { display: none !important; }</style></head><body class="text-gray-800 saved-html-view preview-mode">${readOnlyDayViewHTML}<script type="application/json" id="embeddedTripDayData">${safeDayDataString}<\/script></body></html>`;
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const groupTitle = groupData.groupTitle ? groupData.groupTitle.replace(/[^a-z0-9가-힣]/gi, '_') : `그룹${groupIndex}`;
    const fileName = `DAY${dayIndex + 1}_${groupTitle}_${dayDataToSave.date}.html`;
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = fileName;
    document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(link.href);
    showToast(`DAY ${dayIndex + 1} 일정이 HTML 파일로 저장되었습니다.`);
}

// --- File Loading ---
function handleLoadDetailedItineraryFromHtml(groupIndex, file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const htmlString = e.target.result; const parser = new DOMParser(); const doc = parser.parseFromString(htmlString, "text/html");
            const embeddedDataElement = doc.getElementById('embeddedTripData');
            if (embeddedDataElement && embeddedDataElement.textContent) {
                const loadedData = JSON.parse(embeddedDataElement.textContent);
                if (loadedData && Array.isArray(loadedData.days)) {
                    loadedData.days.forEach(day => {
                        if (day.date) { const validatedLoadedDate = parseAndFormatDateInput(String(day.date)); if (validatedLoadedDate && isValidYyyyMmDd(validatedLoadedDate)) day.date = validatedLoadedDate; else { console.warn(`Loaded HTML day date invalid: '${day.date}'. Defaulting to today.`); day.date = dateToYyyyMmDd(new Date()); }} else { console.warn("Loaded HTML day missing date. Setting to today."); day.date = dateToYyyyMmDd(new Date()); }
                        if (typeof day.isCollapsed === 'undefined') day.isCollapsed = false; if (typeof day.editingDate === 'undefined') day.editingDate = false;
                        day.activities.forEach(act => { if(!act.id) act.id = generateId(); });
                    });
                    if (typeof loadedData.title === 'undefined') loadedData.title = "여행 일정표";
                    quoteGroupDataStore[groupIndex].detailedItinerary = loadedData;
                    document.querySelector(`input[name="detailed_itinerary_title[${groupIndex}]"]`).value = quoteGroupDataStore[groupIndex].detailedItinerary.title;
                    renderDetailedItineraryForGroup(groupIndex); showToast('HTML 파일에서 상세 일정을 불러왔습니다.');
                } else { throw new Error('유효하지 않은 데이터 형식입니다 (days 배열 누락).'); }
            } else { throw new Error('HTML 파일에서 상세 일정 데이터(ID: embeddedTripData)를 찾을 수 없습니다.'); }
        } catch (err) { console.error("HTML 불러오기 오류:", err); showToast(`오류: ${err.message}`, 3000, true); }};
    reader.onerror = () => { showToast('파일 읽기 오류.', 3000, true); }; reader.readAsText(file);
}
function handleLoadDetailedDayFromHtml(groupIndex, dayIndexToOverwrite, file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const htmlString = e.target.result; const parser = new DOMParser(); const doc = parser.parseFromString(htmlString, "text/html");
            const embeddedDataElement = doc.getElementById('embeddedTripDayData');
            if (embeddedDataElement && embeddedDataElement.textContent) {
                const loadedDayData = JSON.parse(embeddedDataElement.textContent);
                if (loadedDayData && loadedDayData.activities !== undefined) {
                    let finalDate = dateToYyyyMmDd(new Date());
                    if (loadedDayData.date) { const validatedLoadedDate = parseAndFormatDateInput(String(loadedDayData.date)); if (validatedLoadedDate && isValidYyyyMmDd(validatedLoadedDate)) finalDate = validatedLoadedDate; else { showToast(`불러온 날짜 형식이 올바르지 않아 (${loadedDayData.date}), 현재 날짜로 설정합니다.`, 4000, true); const existingDay = quoteGroupDataStore[groupIndex].detailedItinerary.days[dayIndexToOverwrite]; if (existingDay && existingDay.date && isValidYyyyMmDd(existingDay.date)) finalDate = existingDay.date; else finalDate = dateToYyyyMmDd(new Date()); }} else { showToast(`불러온 데이터에 날짜 정보가 없어, 현재 날짜로 설정합니다.`, 4000, true); const existingDay = quoteGroupDataStore[groupIndex].detailedItinerary.days[dayIndexToOverwrite]; if (existingDay && existingDay.date && isValidYyyyMmDd(existingDay.date)) finalDate = existingDay.date; else finalDate = dateToYyyyMmDd(new Date()); }
                    loadedDayData.date = finalDate;
                    loadedDayData.activities.forEach(act => { if(!act.id) act.id = generateId(); });
                    if (!quoteGroupDataStore[groupIndex].detailedItinerary.days[dayIndexToOverwrite]) quoteGroupDataStore[groupIndex].detailedItinerary.days[dayIndexToOverwrite] = {};
                    quoteGroupDataStore[groupIndex].detailedItinerary.days[dayIndexToOverwrite] = { ...quoteGroupDataStore[groupIndex].detailedItinerary.days[dayIndexToOverwrite], ...loadedDayData, isCollapsed: loadedDayData.isCollapsed !== undefined ? loadedDayData.isCollapsed : false, editingDate: false };
                    recalculateAllDetailedDates(groupIndex, dayIndexToOverwrite); renderDetailedItineraryForGroup(groupIndex);
                    showToast(`DAY ${dayIndexToOverwrite + 1} 일정을 불러온 내용으로 덮어썼습니다.`);
                } else { throw new Error('유효하지 않은 날짜 데이터 형식입니다 (activities 누락).'); }
            } else { throw new Error('HTML 파일에서 날짜 데이터(ID: embeddedTripDayData)를 찾을 수 없습니다.'); }
        } catch (err) { console.error("날짜 HTML 덮어쓰기 오류:", err); showToast(`오류: ${err.message}`, 3000, true); }};
    reader.onerror = () => { showToast('파일 읽기 오류.', 3000, true); }; reader.readAsText(file);
}
function handleLoadDetailedItineraryFromExcel(groupIndex, file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = new Uint8Array(e.target.result); const workbook = XLSX.read(data, {type: 'array', cellDates: true, dateNF:'yyyy-mm-dd'});
            const firstSheetName = workbook.SheetNames[0]; const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, {header: 1, raw: false, defval: ""});
            if (jsonData.length < 2) { throw new Error("엑셀 파일에 데이터가 없거나 헤더만 존재합니다."); }
            const newItinerary = { title: quoteGroupDataStore[groupIndex].detailedItinerary.title || "엑셀에서 가져온 일정", days: [] };
            let currentDayObject = null; let errors = [];
            for (let i = 1; i < jsonData.length; i++) {
                const row = jsonData[i]; const excelRowNumber = i + 1;
                const rawDate = row[0] ? String(row[0]).trim() : ""; let time = row[1] ? String(row[1]).trim() : "";
                if (time.includes(':')) time = time.replace(':', ''); if (time.length === 3) time = '0' + time;
                const title = row[2] ? String(row[2]).trim() : ""; const description = row[3] ? String(row[3]).trim() : "";
                const icon = row[4] ? String(row[4]).trim() : ""; const locationLink = row[5] ? String(row[5]).trim() : "";
                const imageUrl = row[6] ? String(row[6]).trim() : ""; const cost = row[7] ? String(row[7]).trim() : ""; const notes = row[8] ? String(row[8]).trim() : "";
                let formattedDate = ""; if (!rawDate) { errors.push(`${excelRowNumber}행: 날짜(A열) 누락.`); continue; }
                let parsedDateObj = null;
                if (typeof row[0] === 'number') { parsedDateObj = XLSX.SSF.parse_date_code(row[0]); if(parsedDateObj) formattedDate = `${parsedDateObj.y}-${String(parsedDateObj.m).padStart(2,'0')}-${String(parsedDateObj.d).padStart(2,'0')}`; }
                else if (typeof rawDate === 'string') { const potentialDate = parseAndFormatDateInput(rawDate); if (potentialDate && isValidYyyyMmDd(potentialDate)) formattedDate = potentialDate; }
                if (!formattedDate || !isValidYyyyMmDd(formattedDate)) { errors.push(`${excelRowNumber}행: 날짜(A열) 형식 오류 ("${rawDate}").`); continue; }
                if (!title) { errors.push(`${excelRowNumber}행: 활동명(C열) 누락.`); continue; }
                if (time && (!/^\d{4}$/.test(time) || parseInt(time.substring(0,2),10) > 23 || parseInt(time.substring(2,4),10) > 59 )) { errors.push(`${excelRowNumber}행: 시간(B열) 형식 오류 ("${row[1]}"). 시간 정보 없이 진행.`); time = "";}
                if (!currentDayObject || currentDayObject.date !== formattedDate) { currentDayObject = { date: formattedDate, activities: [], isCollapsed: false, editingDate: false }; newItinerary.days.push(currentDayObject); }
                currentDayObject.activities.forEach(act => { if(!act.id) act.id = generateId(); });
                if (typeof currentDayObject.isCollapsed === 'undefined') currentDayObject.isCollapsed = false; if (typeof currentDayObject.editingDate === 'undefined') currentDayObject.editingDate = false;
                currentDayObject.activities.push({ id: generateId(), time, icon, title, description, locationLink, imageUrl, cost, notes });
            }
            if (errors.length > 0) { showToast("엑셀 불러오기 중 일부 오류 발생. 콘솔 확인.", 3000, true); console.warn("엑셀 오류:\n" + errors.join("\n")); }
            if (newItinerary.days.length > 0) {
                quoteGroupDataStore[groupIndex].detailedItinerary = newItinerary;
                if (typeof quoteGroupDataStore[groupIndex].detailedItinerary.title === 'undefined') quoteGroupDataStore[groupIndex].detailedItinerary.title = "엑셀에서 가져온 일정";
                quoteGroupDataStore[groupIndex].detailedItinerary.days.forEach(day => { if (typeof day.isCollapsed === 'undefined') day.isCollapsed = false; if (typeof day.editingDate === 'undefined') day.editingDate = false; day.activities.forEach(act => { if(!act.id) act.id = generateId(); }); });
                document.querySelector(`input[name="detailed_itinerary_title[${groupIndex}]"]`).value = newItinerary.title;
                renderDetailedItineraryForGroup(groupIndex); showToast('엑셀에서 상세 일정을 성공적으로 불러왔습니다.');
            } else if (errors.length === 0) { showToast('엑셀 파일에 처리할 유효한 데이터가 없습니다.', 3000, true); }
        } catch (err) { console.error("엑셀 불러오기 오류:", err); showToast(`엑셀 파일 처리 오류: ${err.message}`, 3000, true); }};
    reader.onerror = () => { showToast('파일 읽기 오류.', 3000, true); }; reader.readAsArrayBuffer(file);
}


// ----- 초기화 및 이벤트 리스너 -----
document.addEventListener('DOMContentLoaded', function() {
    enableSelectOnFocus('div.container');
    populateIconDropdown(); // 아이콘 드롭다운 채우기

    // 처음 로드 시 기본 그룹 1개 생성 및 활성화
    if (Object.keys(quoteGroupDataStore).length === 0) {
         createQuoteGroup(quoteGroupCounter++); // 첫 번째 그룹 생성, 내부에서 activateTab(0) 호출
    } else {
        // 데이터가 이미 로드된 경우 (예: HTML 파일에서 복원) 첫 번째 탭 활성화
        const firstKey = Object.keys(quoteGroupDataStore).sort((a,b) => parseInt(a) - parseInt(b))[0];
        if (firstKey !== undefined) {
            activateTab(firstKey);
        }
    }
    

    document.getElementById('addGlobalQuoteGroupBtn').addEventListener('click', function() {
        const newGroupIndex = quoteGroupCounter++; // 새 그룹을 위한 고유 ID 생성
        const newGroupElement = createQuoteGroup(newGroupIndex); // sourceGroupData가 null이므로 내부에서 activateTab 호출됨
        if (newGroupElement) {
            const titleInputToFocus = newGroupElement.querySelector('input[name^="quote_group_title"]');
            if (titleInputToFocus) {
                 setTimeout(() => titleInputToFocus.focus(), 50); // 탭 활성화 후 포커스
            }
        }
    });

    document.getElementById('quoteGroupsContainer').addEventListener('click', function(e) {
        const target = e.target;
        const quoteGroupElement = target.closest('.quote-group-section');
        if (!quoteGroupElement) return;
        const groupIndex = quoteGroupElement.dataset.groupIndex; // 현재 활성(보이는) 패널의 인덱스

        if (target.closest('.add-detailed-itinerary-day-button')) handleAddDetailedItineraryDay(groupIndex);
        else if (target.closest('.add-activity-to-day-button')) { const dayIndex = target.closest('.add-activity-to-day-button').dataset.dayIndex; openActivityModal(groupIndex, parseInt(dayIndex)); }
        else if (target.closest('.edit-detailed-date-button')) { const dayIndex = parseInt(target.closest('.edit-detailed-date-button').dataset.dayIndex); handleEditDayDate(groupIndex, dayIndex); }
        else if (target.closest('.save-detailed-date-button')) { const dayIndex = parseInt(target.closest('.save-detailed-date-button').dataset.dayIndex); handleSaveDayDate(groupIndex, dayIndex); }
        else if (target.closest('.cancel-detailed-date-edit-button')) { const dayIndex = parseInt(target.closest('.cancel-detailed-date-edit-button').dataset.dayIndex); handleCancelEditDayDate(groupIndex, dayIndex); }
        else if (target.closest('.delete-detailed-day-button')) { const dayIndex = parseInt(target.closest('.delete-detailed-day-button').dataset.dayIndex); handleDeleteDetailedItineraryDay(groupIndex, dayIndex); }
        else if (target.closest('.toggle-detailed-day-collapse-button')) { const dayIndex = parseInt(target.closest('.toggle-detailed-day-collapse-button').dataset.dayIndex); handleToggleDayCollapse(groupIndex, dayIndex); }
        else if (target.closest('.edit-activity-button')) { const dayIndex = parseInt(target.closest('.edit-activity-button').dataset.dayIndex); const activityId = target.closest('.edit-activity-button').dataset.activityId; openActivityModal(groupIndex, dayIndex, activityId); }
        else if (target.closest('.duplicate-activity-button')) { const dayIndex = parseInt(target.closest('.duplicate-activity-button').dataset.dayIndex); const activityId = target.closest('.duplicate-activity-button').dataset.activityId; handleDuplicateActivity(groupIndex, dayIndex, activityId); }
        else if (target.closest('.delete-activity-button')) { const dayIndex = parseInt(target.closest('.delete-activity-button').dataset.dayIndex); const activityId = target.closest('.delete-activity-button').dataset.activityId; handleDeleteActivity(groupIndex, dayIndex, activityId); }
        else if (target.closest('.load-detailed-itinerary-html-btn')) { currentGroupIndexForLoad = groupIndex; document.getElementById('detailedItineraryHtmlLoadInput_main').click(); }
        else if (target.closest('.load-detailed-itinerary-excel-btn')) { currentGroupIndexForLoad = groupIndex; document.getElementById('detailedItineraryExcelLoadInput_main').click(); }
        else if (target.closest('.load-detailed-day-html-button')) { const dayIndex = parseInt(target.closest('.load-detailed-day-html-button').dataset.dayIndex); currentGroupIndexForLoad = groupIndex; currentDayIndexForLoad = dayIndex; document.getElementById('detailedDayHtmlLoadInput_main').click(); }
        else if (target.closest('.save-detailed-itinerary-html-btn')) { const grpIdx = target.closest('.save-detailed-itinerary-html-btn').dataset.groupIndex; handleSaveDetailedItineraryAsHtml(grpIdx); }
        else if (target.closest('.save-detailed-day-html-btn')) { const grpIdx = target.closest('.save-detailed-day-html-btn').dataset.groupIndex; const dayIdx = parseInt(target.closest('.save-detailed-day-html-btn').dataset.dayIndex); handleSaveDetailedDayAsHtml(grpIdx, dayIdx); }


        const priceSubgroupElement = target.closest('.price-subgroup');
        if (target.closest('.delete-quote-group-btn')) {
            handleDeleteQuoteGroup(groupIndex); // 탭 버튼의 X 아이콘과 동일한 함수 호출
        }
        else if (target.closest('.copy-quote-group-btn')) {
            const sourceGroupData = JSON.parse(JSON.stringify(quoteGroupDataStore[groupIndex]));
            sourceGroupData.groupTitle = `${sourceGroupData.groupTitle} (복사)`;
            // 상세 일정 내 activity ID 재생성
            if (sourceGroupData.detailedItinerary && sourceGroupData.detailedItinerary.days) {
                sourceGroupData.detailedItinerary.days.forEach(day => {
                    if (day.activities) {
                        day.activities.forEach(activity => activity.id = generateId());
                    }
                });
            }
            const newCopiedGroupIndex = quoteGroupCounter++;
            createQuoteGroup(newCopiedGroupIndex, null, sourceGroupData); // sourceGroupData가 있으므로, activateTab은 createQuoteGroup에서 호출 안됨
            activateTab(newCopiedGroupIndex); // 복사된 새 탭을 활성화
            showToast('견적 그룹이 복사되어 새 탭으로 열렸습니다.');
        }
        else if (target.closest('.delete-dynamic-section-btn')) {
            const dynamicSection = target.closest('.dynamic-section');
            if (dynamicSection) {
                const subGroupIndex = dynamicSection.dataset.subGroupIndex;
                if (dynamicSection.classList.contains('price-subgroup')) { quoteGroupDataStore[groupIndex].priceSubgroups.splice(subGroupIndex, 1);}
                else if (dynamicSection.classList.contains('flight-schedule-subgroup')) { quoteGroupDataStore[groupIndex].flightSubgroups.splice(subGroupIndex, 1); }
                dynamicSection.remove();
                if (dynamicSection.classList.contains('price-subgroup')) {
                    const remainingSubgroups = quoteGroupElement.querySelectorAll('.price-subgroup');
                    remainingSubgroups.forEach((sg, newIdx) => sg.dataset.subGroupIndex = newIdx);
                } else if (dynamicSection.classList.contains('flight-schedule-subgroup')) {
                     const remainingSubgroups = quoteGroupElement.querySelectorAll('.flight-schedule-subgroup');
                    remainingSubgroups.forEach((sg, newIdx) => sg.dataset.subGroupIndex = newIdx);
                }

                if (priceSubgroupElement) { const parentPriceSubgroup = dynamicSection.closest('.price-subgroup'); if(parentPriceSubgroup) updateGrandTotalForSubgroup(parentPriceSubgroup); }
            }
        } else if (target.closest('.delete-row')) {
            const row = target.closest('tr'); const tableBody = row.parentElement; const subGroupElement = target.closest('.dynamic-section');
            if(row && subGroupElement){
                const groupIdx = subGroupElement.dataset.groupIndex; const subGroupIndex = subGroupElement.dataset.subGroupIndex;
                const rowIndex = Array.from(tableBody.children).indexOf(row);
                if(subGroupElement.classList.contains('price-subgroup')){ quoteGroupDataStore[groupIdx].priceSubgroups[subGroupIndex].rows.splice(rowIndex, 1); updateGrandTotalForSubgroup(subGroupElement); }
                else if (subGroupElement.classList.contains('flight-schedule-subgroup')){ quoteGroupDataStore[groupIdx].flightSubgroups[subGroupIndex].rows.splice(rowIndex, 1);}
                row.remove();
            } else if (row && tableBody.id.startsWith('itineraryTableBody_')) {
                const groupIdx = target.closest('.quote-group-section').dataset.groupIndex;
                const rowIndex = Array.from(tableBody.children).indexOf(row);
                quoteGroupDataStore[groupIdx].itinerarySummaryRows.splice(rowIndex, 1); row.remove();
            }
        } else if (target.closest('.add-itinerary-row-to-group')) {
            const itineraryTbody = quoteGroupElement.querySelector(`#itineraryTableBody_${groupIndex}`);
            const newRowData = { dayNo: "", dayDate: "", sCity: "", eCity: "", hotel: "", traffic: "", bigo: "" };
            if (!quoteGroupDataStore[groupIndex].itinerarySummaryRows) quoteGroupDataStore[groupIndex].itinerarySummaryRows = [];
            quoteGroupDataStore[groupIndex].itinerarySummaryRows.push(newRowData);
            addItineraryRowForGroupUI(itineraryTbody, groupIndex, newRowData.dayNo, newRowData.dayDate, newRowData.sCity, newRowData.eCity, newRowData.hotel, newRowData.traffic, newRowData.bigo);
        }
    });

     document.getElementById('quoteGroupsContainer').addEventListener('input', function(e) {
        const target = e.target; const quoteGroupElement = target.closest('.quote-group-section'); if (!quoteGroupElement) return;
        const groupIndex = quoteGroupElement.dataset.groupIndex;
        if (target.matches('input[name^="quote_group_title"]')) { quoteGroupDataStore[groupIndex].groupTitle = target.value;} // 제목 변경 시 탭 제목도 업데이트는 createQuoteGroup의 이벤트 리스너에서 처리
        else if (target.matches('textarea[name^="included_items_textarea"]')) { quoteGroupDataStore[groupIndex].inclusionExclusion.includedTextarea = target.value;}
        else if (target.matches('textarea[name^="excluded_items_textarea"]')) { quoteGroupDataStore[groupIndex].inclusionExclusion.excludedTextarea = target.value;}
        else if (target.matches('input[name="price_subgroup_title"]')) {
            const subGroupElement = target.closest('.price-subgroup');
            if (subGroupElement) {
                const subGroupIndex = subGroupElement.dataset.subGroupIndex;
                if(quoteGroupDataStore[groupIndex].priceSubgroups[subGroupIndex]) {
                   quoteGroupDataStore[groupIndex].priceSubgroups[subGroupIndex].title = target.value;
                }
            }
        }
        else if (target.matches('input[name^="flight_group_title"]')) {
            const subGroupElement = target.closest('.flight-schedule-subgroup');
             if (subGroupElement) {
                const subGroupIndex = subGroupElement.dataset.subGroupIndex;
                if(quoteGroupDataStore[groupIndex].flightSubgroups[subGroupIndex]) {
                   quoteGroupDataStore[groupIndex].flightSubgroups[subGroupIndex].title = target.value;
                }
            }
        }
        else if (target.classList.contains('flight-schedule-input')) {
            const subGroupElement = target.closest('.flight-schedule-subgroup'); const subGroupIndex = subGroupElement.dataset.subGroupIndex;
            const rowElement = target.closest('tr'); const rowIndex = Array.from(rowElement.parentElement.children).indexOf(rowElement);
            const field = target.dataset.field;
            if(quoteGroupDataStore[groupIndex].flightSubgroups[subGroupIndex] && quoteGroupDataStore[groupIndex].flightSubgroups[subGroupIndex].rows[rowIndex]) quoteGroupDataStore[groupIndex].flightSubgroups[subGroupIndex].rows[rowIndex][field] = target.value;
        } else if (target.classList.contains('itinerary-schedule-input')) {
            const rowElement = target.closest('tr'); const rowIndex = Array.from(rowElement.parentElement.children).indexOf(rowElement);
            const field = target.dataset.field; if (quoteGroupDataStore[groupIndex].itinerarySummaryRows[rowIndex]) quoteGroupDataStore[groupIndex].itinerarySummaryRows[rowIndex][field] = target.value;
        } else if (target.matches('input[name^="detailed_itinerary_title"]')) { if (quoteGroupDataStore[groupIndex] && quoteGroupDataStore[groupIndex].detailedItinerary) quoteGroupDataStore[groupIndex].detailedItinerary.title = target.value;}

        if (target.matches('.price-per-person, .person-count, input[name*="p_title"], input[name*="p_bigo"]')) { // More flexible selector for p_title and p_bigo
            const subgroupElement = target.closest('.price-subgroup');
            if (subgroupElement) {
                const rowElement = target.closest('tr');
                const rowIndex = Array.from(rowElement.parentElement.children).indexOf(rowElement);
                const subGroupIndex = subgroupElement.dataset.subGroupIndex;

                const priceRow = quoteGroupDataStore[groupIndex].priceSubgroups[subGroupIndex].rows[rowIndex];
                if (priceRow) {
                    if (target.matches('.price-per-person')) priceRow.perPrice = target.value;
                    else if (target.matches('.person-count')) priceRow.number = target.value;
                    else if (target.name.includes('p_title')) priceRow.title = target.value;
                    else if (target.name.includes('p_bigo')) priceRow.bigo = target.value;
                }
                updateRowTotalForSubgroup({target: target}, subgroupElement);
            }
        }
    });

     document.getElementById('quoteGroupsContainer').addEventListener('paste', function(e) {
        const targetInput = e.target; const quoteGroupElement = targetInput.closest('.quote-group-section'); if (!quoteGroupElement) return;
        const groupIndex = quoteGroupElement.dataset.groupIndex;
        if (targetInput.matches('.flight-schedule-input')) { const flightSubgroupElement = targetInput.closest('.flight-schedule-subgroup'); if (flightSubgroupElement) { const subGroupIndex = flightSubgroupElement.dataset.subGroupIndex; handlePasteToFlightTableForSubgroup(e, groupIndex, subGroupIndex);}}
        else if (targetInput.matches('.itinerary-schedule-input')) { const itineraryTableBody = targetInput.closest('tbody.itinerary-table-body-for-group'); if (itineraryTableBody) handlePasteToItineraryTableForGroup(e, itineraryTableBody, groupIndex); }
    });

    document.getElementById('detailedItineraryHtmlLoadInput_main').addEventListener('change', function(event) { if (currentGroupIndexForLoad === null) return; const file = event.target.files[0]; if (file) handleLoadDetailedItineraryFromHtml(currentGroupIndexForLoad, file); this.value = null; currentGroupIndexForLoad = null;});
    document.getElementById('detailedItineraryExcelLoadInput_main').addEventListener('change', function(event) { if (currentGroupIndexForLoad === null) return; const file = event.target.files[0]; if (file) handleLoadDetailedItineraryFromExcel(currentGroupIndexForLoad, file); this.value = null; currentGroupIndexForLoad = null; });
    document.getElementById('detailedDayHtmlLoadInput_main').addEventListener('change', function(event) { if (currentGroupIndexForLoad === null || currentDayIndexForLoad === null) return; const file = event.target.files[0]; if (file) handleLoadDetailedDayFromHtml(currentGroupIndexForLoad, currentDayIndexForLoad, file); this.value = null; currentGroupIndexForLoad = null; currentDayIndexForLoad = null;});

    document.getElementById('loadQuoteFile').addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const fullHtml = e.target.result;
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(fullHtml, "text/html");

                    const dataScript = doc.getElementById('fullQuoteData');
                    if (dataScript && dataScript.textContent) {
                        const data = JSON.parse(dataScript.textContent);
                        restoreEditorFromData(data); 
                    } else {
                        console.warn("전체 견적 데이터 태그를 찾을 수 없습니다. DOM에서 수동 파싱 시도 (제한적).");
                        manualParseAndRestore(doc);
                        showToast("HTML에서 일부 정보를 불러왔습니다 (제한적).", 4000);
                    }
                } catch (err) {
                    console.error("견적 불러오기 오류:", err);
                    showToast("견적 파일 불러오기 중 오류 발생: " + err.message, 5000, true);
                }
            };
            reader.readAsText(file);
            this.value = null; 
        }
    });
});

function enableSelectOnFocus(containerSelector = 'body') {
    const container = document.querySelector(containerSelector); if (!container) return;
    container.addEventListener('focusin', function(event) {
        const target = event.target;
        if (target.matches('input[type="text"], input[type="email"], input[type="number"], textarea')) { if (typeof target.select === 'function' && !target.isContentEditable) setTimeout(() => { target.select(); }, 0); }
    });
}

// ----- 요금 섹션 -----
function initPriceSectionForGroup(quoteGroupElement, groupIndex, sourcePriceSubgroups = null) {
    const addPriceSubgroupButton = quoteGroupElement.querySelector('.add-price-subgroup-button');
    const priceSectionsContainer = quoteGroupElement.querySelector(`#priceSectionsContainer_${groupIndex}`);
    if (!quoteGroupDataStore[groupIndex].priceSubgroups) { quoteGroupDataStore[groupIndex].priceSubgroups = []; }
    let currentSubgroups = quoteGroupDataStore[groupIndex].priceSubgroups;
    if (addPriceSubgroupButton) {
         addPriceSubgroupButton.addEventListener('click', () => {
            const newSubgroupData = {title: "", rows: [ { title: "성인요금", perPrice: "0", number: 1, bigo: "" }, { title: "소아요금", perPrice: "0", number: 0, bigo: "2~12세미만(좌석점유)" }, { title: "유아요금", perPrice: "0", number: 0, bigo: "24개월미만(좌석미점유)" } ]};
            currentSubgroups.push(newSubgroupData);
            createPriceSubgroup(priceSectionsContainer, groupIndex, currentSubgroups.length - 1, newSubgroupData);
        });
    }
    if (currentSubgroups.length > 0) { currentSubgroups.forEach((subgroupData, idx) => createPriceSubgroup(priceSectionsContainer, groupIndex, idx, subgroupData)); }
    else { const defaultSubgroupData = {title: "", rows: [ { title: "성인요금", perPrice: "0", number: 1, bigo: "" }, { title: "소아요금", perPrice: "0", number: 0, bigo: "2~12세미만(좌석점유)" }, { title: "유아요금", perPrice: "0", number: 0, bigo: "24개월미만(좌석미점유)" } ]}; currentSubgroups.push(defaultSubgroupData); createPriceSubgroup(priceSectionsContainer, groupIndex, 0, defaultSubgroupData); }
}
function createPriceSubgroup(container, groupIndex, subGroupIndex, sourceSubgroupData = null) {
    const sectionId = `priceSection_${groupIndex}_${subGroupIndex}`; const tableBodyId = `priceTableBody_${groupIndex}_${subGroupIndex}`; const grandTotalId = `grandTotal_${groupIndex}_${subGroupIndex}`; const groupTitleInputName = `price_subgroup_title[${groupIndex}][${subGroupIndex}]`;
    const sectionDiv = document.createElement('div'); sectionDiv.className = 'dynamic-section price-subgroup'; sectionDiv.id = sectionId; sectionDiv.dataset.groupIndex = groupIndex; sectionDiv.dataset.subGroupIndex = subGroupIndex;
    const initialSubgroupTitle = sourceSubgroupData ? sourceSubgroupData.title : "";
    sectionDiv.innerHTML = `<button type="button" class="delete-dynamic-section delete-dynamic-section-btn text-red-500 hover:text-red-700" title="이 요금 소그룹 삭제"><i class="fas fa-trash-alt mr-1"></i>삭제</button><div class="mb-2"><input type="text" name="${groupTitleInputName}" class="w-full px-3 py-2 border rounded focus:outline-none focus:border-custom-orange text-md font-semibold" placeholder="견적설명 (예: 인천출발, 김해출발, A객실, B객실)" value="${initialSubgroupTitle}"></div><div class="overflow-x-auto"><table class="min-w-full bg-white border price-table text-sm"><thead><tr class="bg-gray-100"><th class="border p-2 text-center" style="width: 20%;">내역</th><th class="border p-2 text-center" style="width: 15%;">1인당 금액</th><th class="border p-2 text-center" style="width: 8%;">인원</th><th class="border p-2 text-center" style="width: 17%;">총 금액</th><th class="border p-2 text-center">비고</th><th class="border p-2 text-center w-12">삭제</th></tr></thead><tbody id="${tableBodyId}" class="price-table-body"></tbody><tfoot><tr><td colspan="3" class="border p-2 text-right font-bold text-xs">총 합계</td><td class="border p-1 font-bold"><input type="text" name="p_sumprice[${groupIndex}][${subGroupIndex}]" id="${grandTotalId}" class="w-full border-0 focus:ring-0 grand-total-input text-xs p-1 text-right" value="0" readonly></td><td colspan="2" class="border p-2"><button type="button" class="add-price-row-to-subgroup bg-custom-green text-white px-2 py-1 rounded hover:bg-opacity-90 transition text-xs"><i class="fas fa-plus mr-1"></i> 행 추가</button></td></tr></tfoot></table></div>`;
    container.appendChild(sectionDiv); const tbody = sectionDiv.querySelector('.price-table-body');
    const rowsToRender = (sourceSubgroupData && sourceSubgroupData.rows && sourceSubgroupData.rows.length > 0) ? sourceSubgroupData.rows : [ { title: "성인요금", perPrice: "0", number: 1, bigo: "" }, { title: "소아요금", perPrice: "0", number: 0, bigo: "2~12세미만(좌석점유)" }, { title: "유아요금", perPrice: "0", number: 0, bigo: "24개월미만(좌석미점유)" } ];
    rowsToRender.forEach(rowData => addPriceRowToExistingSubgroup(null, sectionDiv, rowData)); initPriceTableForSubgroup(sectionDiv); return sectionDiv;
}
function initPriceTableForSubgroup(subgroupElement) { subgroupElement.querySelectorAll('.price-table-body tr').forEach(row => { const firstInput = row.querySelector('.price-per-person'); if (firstInput) updateRowTotalForSubgroup({ target: firstInput }, subgroupElement); }); const addRowButton = subgroupElement.querySelector('.add-price-row-to-subgroup'); if (addRowButton) addRowButton.addEventListener('click', (e) => addPriceRowToExistingSubgroup(e, subgroupElement)); }
function updateRowTotalForSubgroup(event, subgroupElement) { const row = event.target.closest('tr'); if (!row) return; const pricePerPersonInput = row.querySelector('.price-per-person'); const personCountInput = row.querySelector('.person-count'); const totalPriceInput = row.querySelector('.total-price'); if (!pricePerPersonInput || !personCountInput || !totalPriceInput) return; const pricePerPerson = parseFloat(pricePerPersonInput.value) || 0; const personCount = parseInt(personCountInput.value) || 0; totalPriceInput.value = (pricePerPerson * personCount).toLocaleString(); updateGrandTotalForSubgroup(subgroupElement); }
function updateGrandTotalForSubgroup(subgroupElement) { let grandTotal = 0; subgroupElement.querySelectorAll('.price-table-body .total-price').forEach(cell => grandTotal += parseFloat(cell.value.replace(/,/g, '')) || 0); const grandTotalInput = subgroupElement.querySelector('.grand-total-input'); if (grandTotalInput) grandTotalInput.value = grandTotal.toLocaleString(); }
function addPriceRowToExistingSubgroup(event, subgroupElement, rowData = null) { const tbody = subgroupElement.querySelector('.price-table-body'); const groupIndex = subgroupElement.dataset.groupIndex; const subGroupIndex = subgroupElement.dataset.subGroupIndex; if (!tbody || groupIndex === undefined || subGroupIndex === undefined) return; const titleVal = rowData ? rowData.title : "추가 비용"; const perPriceVal = rowData ? rowData.perPrice : "0"; const numberVal = rowData ? rowData.number : "1"; const bigoVal = rowData ? rowData.bigo : ""; const tr = document.createElement('tr'); tr.innerHTML = `<td class="border p-1"><input type="text" name="p_title[${groupIndex}][${subGroupIndex}][]" value="${titleVal}" class="w-full border-0 focus:ring-0 text-xs p-1"></td><td class="border p-1"><input type="number" name="p_perprice[${groupIndex}][${subGroupIndex}][]" class="price-per-person w-full border-0 focus:ring-0 text-xs p-1 text-right" value="${perPriceVal}"></td><td class="border p-1"><input type="number" name="p_number[${groupIndex}][${subGroupIndex}][]" class="person-count w-full border-0 focus:ring-0 text-xs p-1 text-center" value="${numberVal}"></td><td class="border p-1"><input type="text" name="p_totalprice[${groupIndex}][${subGroupIndex}][]" class="w-full border-0 focus:ring-0 total-price text-xs p-1 text-right" value="0" readonly></td><td class="border p-1"><input type="text" name="p_bigo[${groupIndex}][${subGroupIndex}][]" class="w-full border-0 focus:ring-0 text-xs p-1" value="${bigoVal}"></td><td class="border p-1 text-center"><button type="button" class="delete-row text-red-500 hover:text-red-700 text-xs" title="삭제"><i class="fas fa-trash"></i></button></td>`; tbody.appendChild(tr); const firstInput = tr.querySelector('.price-per-person'); if (firstInput) updateRowTotalForSubgroup({ target: firstInput }, subgroupElement); if (event) { if (!quoteGroupDataStore[groupIndex].priceSubgroups[subGroupIndex].rows) { quoteGroupDataStore[groupIndex].priceSubgroups[subGroupIndex].rows = []; } quoteGroupDataStore[groupIndex].priceSubgroups[subGroupIndex].rows.push({ title: titleVal, perPrice: perPriceVal, number: numberVal, bigo: bigoVal }); } }

// ----- 항공 스케줄 섹션 -----
function initFlightScheduleForGroup(quoteGroupElement, groupIndex, sourceFlightSubgroups = null) {
    const addFlightSubgroupButton = quoteGroupElement.querySelector('.add-flight-subgroup-button'); const flightScheduleContainer = quoteGroupElement.querySelector(`#flightScheduleGroupsContainer_${groupIndex}`);
    if (!quoteGroupDataStore[groupIndex].flightSubgroups) { quoteGroupDataStore[groupIndex].flightSubgroups = []; } let currentSubgroups = quoteGroupDataStore[groupIndex].flightSubgroups;
    if (addFlightSubgroupButton) { addFlightSubgroupButton.addEventListener('click', () => { const newSubgroupData = { title: "", rows: [{ flightNum: "", depDate: "", originCity: "", depTime: "", arrDate: "", destCity: "", arrTime: "" }] }; currentSubgroups.push(newSubgroupData); createFlightSubgroup(flightScheduleContainer, groupIndex, currentSubgroups.length - 1, newSubgroupData); }); }
    if (currentSubgroups.length > 0) { currentSubgroups.forEach((subgroupData, idx) => createFlightSubgroup(flightScheduleContainer, groupIndex, idx, subgroupData)); }
    else { const defaultSubgroupData = { title: "", rows: [{ flightNum: "", depDate: "", originCity: "", depTime: "", arrDate: "", destCity: "", arrTime: "" }] }; currentSubgroups.push(defaultSubgroupData); createFlightSubgroup(flightScheduleContainer, groupIndex, 0, defaultSubgroupData); }
}
function createFlightSubgroup(container, groupIndex, subGroupIndex, sourceSubgroupData = null) {
    const groupId = `flightScheduleGroup_${groupIndex}_${subGroupIndex}`; const tableBodyId = `flightTableBody_${groupIndex}_${subGroupIndex}`; const groupTitleInputName = `flight_group_title[${groupIndex}][${subGroupIndex}]`; const groupDiv = document.createElement('div'); groupDiv.className = 'dynamic-section flight-schedule-subgroup'; groupDiv.id = groupId; groupDiv.dataset.groupIndex = groupIndex; groupDiv.dataset.subGroupIndex = subGroupIndex;
    const initialTitle = sourceSubgroupData ? sourceSubgroupData.title : ""; groupDiv.innerHTML = `<button type="button" class="delete-dynamic-section delete-dynamic-section-btn text-red-500 hover:text-red-700" title="이 항공 스케줄 소그룹 삭제"><i class="fas fa-trash-alt mr-1"></i>삭제</button><div class="mb-2"><input type="text" name="${groupTitleInputName}" class="w-full px-3 py-2 border rounded focus:outline-none focus:border-custom-orange text-md font-semibold" placeholder="항공사 (예: 이스타항공)" value="${initialTitle}"></div><div class="overflow-x-auto"><table class="min-w-full bg-white border text-sm"><thead><tr class="bg-gray-100"><th class="border p-2 text-left text-xs">편명</th><th class="border p-2 text-left text-xs">출발일</th><th class="border p-2 text-left text-xs">출발지</th><th class="border p-2 text-left text-xs">출발시간</th><th class="border p-2 text-left text-xs">도착일</th><th class="border p-2 text-left text-xs">도착지</th><th class="border p-2 text-left text-xs">도착시간</th><th class="border p-2 text-center w-12 text-xs">삭제</th></tr></thead><tbody id="${tableBodyId}" class="flight-table-body-subgroup"></tbody><tfoot><tr><td colspan="8" class="border p-2"><button type="button" class="add-flight-row-to-subgroup bg-custom-green text-white px-2 py-1 rounded hover:bg-opacity-90 transition text-xs"><i class="fas fa-plus mr-1"></i> 행 추가</button></td></tr></tfoot></table></div>`;
    container.appendChild(groupDiv); const tbody = groupDiv.querySelector(`#${tableBodyId}`);
    const rowsToRender = (sourceSubgroupData && sourceSubgroupData.rows && sourceSubgroupData.rows.length > 0) ? sourceSubgroupData.rows : [{ flightNum: "", depDate: "", originCity: "", depTime: "", arrDate: "", destCity: "", arrTime: "" }];
    rowsToRender.forEach(rowData => { addFlightRowForSubgroup(tbody, groupIndex, subGroupIndex, rowData.flightNum, rowData.depDate, rowData.originCity, rowData.depTime, rowData.arrDate, rowData.destCity, rowData.arrTime); });
    const addFlightRowButton = groupDiv.querySelector('.add-flight-row-to-subgroup'); if(addFlightRowButton) { addFlightRowButton.addEventListener('click', () => { const targetTbody = groupDiv.querySelector('tbody.flight-table-body-subgroup'); if (targetTbody) { const newRowData = { flightNum: "", depDate: "", originCity: "", depTime: "", arrDate: "", destCity: "", arrTime: "" }; quoteGroupDataStore[groupIndex].flightSubgroups[subGroupIndex].rows.push(newRowData); addFlightRowForSubgroup(targetTbody, groupIndex, subGroupIndex); } }); }
    groupDiv.addEventListener('paste', (e) => handlePasteToFlightTableForSubgroup(e, groupIndex, subGroupIndex)); return groupDiv;
}
function addFlightRowForSubgroup(tbodyElement, groupIndex, subGroupIndex, flightNum = "", depDate = "", originCity = "", depTime = "", arrDate = "", destCity = "", arrTime = "") {
    if (!tbodyElement) return null; const tr = document.createElement('tr'); tr.innerHTML = `<td class="border p-1"><input type="text" name="dep_trans_flight_group[${groupIndex}][${subGroupIndex}][]" data-field="flightNum" class="w-full border-0 focus:ring-0 flight-schedule-input text-xs p-1" value="${flightNum}" placeholder="ZE 561"></td><td class="border p-1"><input type="text" name="start_day_group[${groupIndex}][${subGroupIndex}][]" data-field="depDate" class="w-full border-0 focus:ring-0 flight-schedule-input text-xs p-1" value="${depDate}" placeholder="07월 09일"></td><td class="border p-1"><input type="text" name="dep_start_city_cd_group[${groupIndex}][${subGroupIndex}][]" data-field="originCity" class="w-full border-0 focus:ring-0 flight-schedule-input text-xs p-1" value="${originCity}" placeholder="인천"></td><td class="border p-1"><input type="text" name="dep_start_time_group[${groupIndex}][${subGroupIndex}][]" data-field="depTime" class="w-full border-0 focus:ring-0 flight-schedule-input text-xs p-1" value="${depTime}" placeholder="20:55"></td><td class="border p-1"><input type="text" name="arrival_day_group[${groupIndex}][${subGroupIndex}][]" data-field="arrDate" class="w-full border-0 focus:ring-0 flight-schedule-input text-xs p-1" value="${arrDate}" placeholder="07월 09일"></td><td class="border p-1"><input type="text" name="dep_end_city_cd_group[${groupIndex}][${subGroupIndex}][]" data-field="destCity" class="w-full border-0 focus:ring-0 flight-schedule-input text-xs p-1" value="${destCity}" placeholder="나트랑"></td><td class="border p-1"><input type="text" name="dep_end_time_group[${groupIndex}][${subGroupIndex}][]" data-field="arrTime" class="w-full border-0 focus:ring-0 flight-schedule-input text-xs p-1" value="${arrTime}" placeholder="23:55"></td><td class="border p-1 text-center"><button type="button" class="delete-row text-red-500 hover:text-red-700 text-xs" title="삭제"><i class="fas fa-trash"></i></button></td>`;
    tbodyElement.appendChild(tr); return tr;
}
function initInclusionExclusionForGroup(quoteGroupElement, groupIndex, sourceData = null) { /* Empty, but preserved structure */ }
function initItinerarySummaryForGroup(quoteGroupElement, groupIndex, sourceItineraryRows = null) {
    const tbody = quoteGroupElement.querySelector(`#itineraryTableBody_${groupIndex}`); tbody.innerHTML = '';
    if (!quoteGroupDataStore[groupIndex].itinerarySummaryRows) { quoteGroupDataStore[groupIndex].itinerarySummaryRows = []; }
    if (sourceItineraryRows && sourceItineraryRows.length > 0 && quoteGroupDataStore[groupIndex].itinerarySummaryRows.length === 0) { quoteGroupDataStore[groupIndex].itinerarySummaryRows = JSON.parse(JSON.stringify(sourceItineraryRows)); }
    quoteGroupDataStore[groupIndex].itinerarySummaryRows.forEach(rowData => { addItineraryRowForGroupUI(tbody, groupIndex, rowData.dayNo, rowData.dayDate, rowData.sCity, rowData.eCity, rowData.hotel, rowData.traffic, rowData.bigo); });
}
function addItineraryRowForGroupUI(tbodyElement, groupIndex, dayNoVal = "", dayDateVal = "", sCityVal = "", eCityVal = "", hotelVal = "", trafficVal = "", bigoVal = "") {
    if (!tbodyElement) { console.error("tbodyElement is null in addItineraryRowForGroupUI for groupIndex:", groupIndex); return null; }
    const tr = document.createElement('tr'); tr.innerHTML = `<td class="border p-1"><input type="text" name="schdule_no[${groupIndex}][]" data-field="dayNo" class="w-full border-0 focus:ring-0 itinerary-schedule-input text-xs p-1" value="${dayNoVal}" placeholder="1"></td><td class="border p-1"><input type="text" name="schdule_day[${groupIndex}][]" data-field="dayDate" class="w-full border-0 focus:ring-0 itinerary-schedule-input text-xs p-1" value="${dayDateVal}" placeholder="12월 28일"></td><td class="border p-1"><input type="text" name="schdule_scity[${groupIndex}][]" data-field="sCity" class="w-full border-0 focus:ring-0 itinerary-schedule-input text-xs p-1" value="${sCityVal}" placeholder="인천"></td><td class="border p-1"><input type="text" name="schdule_ecity[${groupIndex}][]" data-field="eCity" class="w-full border-0 focus:ring-0 itinerary-schedule-input text-xs p-1" value="${eCityVal}" placeholder="푸꾸옥"></td><td class="border p-1"><input type="text" name="schdule_hotel[${groupIndex}][]" data-field="hotel" class="w-full border-0 focus:ring-0 itinerary-schedule-input text-xs p-1" value="${hotelVal}" placeholder="버고호텔"></td><td class="border p-1"><input type="text" name="schdule_traffic[${groupIndex}][]" data-field="traffic" class="w-full border-0 focus:ring-0 itinerary-schedule-input text-xs p-1" value="${trafficVal}" placeholder="항공"></td><td class="border p-1"><input type="text" name="schdule_bigo[${groupIndex}][]" data-field="bigo" class="w-full border-0 focus:ring-0 itinerary-schedule-input text-xs p-1" value="${bigoVal}"></td><td class="border p-1 text-center"><button type="button" class="delete-row text-red-500 hover:text-red-700 text-xs" title="삭제"><i class="fas fa-trash"></i></button></td>`;
    tbodyElement.appendChild(tr); return tr;
}
function handlePasteToFlightTableForSubgroup(event, groupIndex, subGroupIndex) {
    const targetInput = event.target; if (!targetInput.matches('.flight-schedule-input')) return; event.preventDefault();
    const pasteData = (event.clipboardData || window.clipboardData).getData('text/plain'); const rowsOfData = pasteData.split(/\r\n|\n|\r/);
    let currentRowElement = targetInput.closest('tr'); let currentCellIndexInRow = Array.from(currentRowElement.cells).indexOf(targetInput.closest('td'));
    const currentTbody = currentRowElement.closest('tbody.flight-table-body-subgroup'); const flightSubgroupData = quoteGroupDataStore[groupIndex].flightSubgroups[subGroupIndex];
    rowsOfData.forEach((rowText, pasteRowIndex) => {
        if (!rowText.trim()) return; const cellsOfData = rowText.split('\t'); let currentTbodyRowIndex = Array.from(currentTbody.children).indexOf(currentRowElement);
        if (!currentRowElement) { const newRowData = { flightNum: "", depDate: "", originCity: "", depTime: "", arrDate: "", destCity: "", arrTime: "" }; flightSubgroupData.rows.push(newRowData); currentRowElement = addFlightRowForSubgroup(currentTbody, groupIndex, subGroupIndex); if (!currentRowElement) return; currentCellIndexInRow = 0; currentTbodyRowIndex = flightSubgroupData.rows.length -1; }
        const inputFieldsInCurrentRow = currentRowElement.querySelectorAll('.flight-schedule-input'); let dataCellIdx = 0;
        for (let i = currentCellIndexInRow; i < inputFieldsInCurrentRow.length && dataCellIdx < cellsOfData.length; i++) { const fieldName = inputFieldsInCurrentRow[i].dataset.field; const pastedValue = cellsOfData[dataCellIdx].trim(); inputFieldsInCurrentRow[i].value = pastedValue; if (flightSubgroupData.rows[currentTbodyRowIndex]) { flightSubgroupData.rows[currentTbodyRowIndex][fieldName] = pastedValue; } dataCellIdx++; }
        const nextTRElement = currentRowElement.nextElementSibling; currentRowElement = (nextTRElement && nextTRElement.cells.length > 0) ? nextTRElement : null; currentCellIndexInRow = 0;
    });
}
function handlePasteToItineraryTableForGroup(event, tbodyElement, groupIndex) {
    const targetInput = event.target; if (!targetInput.matches('.itinerary-schedule-input')) return; event.preventDefault();
    const pasteData = (event.clipboardData || window.clipboardData).getData('text/plain'); const rowsOfData = pasteData.split(/\r\n|\n|\r/);
    let currentRowElement = targetInput.closest('tr'); let currentCellIndexInRow = Array.from(currentRowElement.cells).indexOf(targetInput.closest('td'));
    const summaryRowsData = quoteGroupDataStore[groupIndex].itinerarySummaryRows;
    rowsOfData.forEach((rowText, pasteRowIndex) => {
        if (!rowText.trim()) return; const cellsOfData = rowText.split('\t'); let currentTbodyRowIndex = Array.from(tbodyElement.children).indexOf(currentRowElement);
        if (!currentRowElement) { const newRowData = { dayNo: "", dayDate: "", sCity: "", eCity: "", hotel: "", traffic: "", bigo: "" }; summaryRowsData.push(newRowData); currentRowElement = addItineraryRowForGroupUI(tbodyElement, groupIndex); if (!currentRowElement) return; currentCellIndexInRow = 0; currentTbodyRowIndex = summaryRowsData.length -1; }
        const inputFieldsInCurrentRow = currentRowElement.querySelectorAll('.itinerary-schedule-input'); let dataCellIdx = 0;
        for (let i = currentCellIndexInRow; i < inputFieldsInCurrentRow.length && dataCellIdx < cellsOfData.length; i++) { const fieldName = inputFieldsInCurrentRow[i].dataset.field; const pastedValue = cellsOfData[dataCellIdx].trim(); inputFieldsInCurrentRow[i].value = pastedValue; if (summaryRowsData[currentTbodyRowIndex]) { summaryRowsData[currentTbodyRowIndex][fieldName] = pastedValue; } dataCellIdx++; }
        const nextTRElement = currentRowElement.nextElementSibling; currentRowElement = (nextTRElement && nextTRElement.cells.length > 0) ? nextTRElement : null; currentCellIndexInRow = 0;
    });
}

function getAllEditorDataAsObject() {
    const data = {
        basicInfo: {
            customerName: document.getElementById('customerName').value,
            customerEmail: document.getElementById('customerEmail').value,
            custcmail: document.getElementById('custcmail').value,
            subject: document.getElementById('subject').value,
            introText: document.getElementById('introText').value,
            goodnm: document.getElementById('goodnm').value,
        },
        travelerInfoText: document.getElementById('travelerInfoText').value,
        quoteGroups: JSON.parse(JSON.stringify(quoteGroupDataStore)),
        contactInfo: {
            empnm: document.getElementById('empnm').value,
            empmail: document.getElementById('empmail').value,
            emptel: document.getElementById('emptel').value,
        }
    };
    return data;
}

function restoreEditorFromData(data) {
    if (!data) {
        showToast("불러올 데이터가 없습니다.", 3000, true);
        return;
    }

    if (data.basicInfo) {
        document.getElementById('customerName').value = data.basicInfo.customerName || '';
        document.getElementById('customerEmail').value = data.basicInfo.customerEmail || '';
        document.getElementById('custcmail').value = data.basicInfo.custcmail || '';
        document.getElementById('subject').value = data.basicInfo.subject || '';
        document.getElementById('introText').value = data.basicInfo.introText || '';
        document.getElementById('goodnm').value = data.basicInfo.goodnm || '';
    }

    document.getElementById('travelerInfoText').value = data.travelerInfoText || '';
    
    // 기존 탭 및 패널 모두 제거
    document.getElementById('quoteTabButtonsContainer').querySelectorAll('.quote-tab-button:not(#addGlobalQuoteGroupBtn)').forEach(btn => btn.remove()); // "새 그룹" 버튼 제외
    document.getElementById('quoteGroupsContainer').innerHTML = '';
    
    quoteGroupDataStore = {}; // 데이터 저장소 초기화
    activeGroupIndex = -1;    // 활성 탭 인덱스 초기화
    currentBorderColorIndex = 0; // 테두리 색상 인덱스 초기화

    let maxOriginalIndex = -1;

    if (data.quoteGroups && typeof data.quoteGroups === 'object' && Object.keys(data.quoteGroups).length > 0) {
        const sortedGroupKeys = Object.keys(data.quoteGroups).map(Number).sort((a, b) => a - b);
        
        sortedGroupKeys.forEach(originalGroupIndex => {
            const groupData = data.quoteGroups[originalGroupIndex];
            if (groupData) {
                if (!groupData.detailedItinerary) groupData.detailedItinerary = { title: "여행 일정표", days: [] };
                if (!Array.isArray(groupData.detailedItinerary.days)) groupData.detailedItinerary.days = [];
                groupData.detailedItinerary.days.forEach(day => {
                    if (!day.activities) day.activities = [];
                    day.activities.forEach(activity => { if (!activity.id) activity.id = generateId(); });
                    if (typeof day.isCollapsed === 'undefined') day.isCollapsed = false;
                    if (typeof day.editingDate === 'undefined') day.editingDate = false;
                });

                createQuoteGroup(originalGroupIndex, null, groupData); // 원본 groupIndex를 그대로 사용
                 if (originalGroupIndex > maxOriginalIndex) {
                    maxOriginalIndex = originalGroupIndex;
                }
            }
        });
        quoteGroupCounter = maxOriginalIndex + 1; // 다음 새 그룹을 위한 ID 준비

        // 모든 그룹 생성 후 첫 번째 (원본 순서상) 탭 활성화
        if (sortedGroupKeys.length > 0) {
            activateTab(sortedGroupKeys[0]);
        }
    } else { // 불러온 데이터에 그룹이 없으면 기본 그룹 하나 생성
        quoteGroupCounter = 0; // 카운터 리셋
        createQuoteGroup(quoteGroupCounter++); // 내부에서 activateTab 호출
    }

    if (data.contactInfo) {
        document.getElementById('empnm').value = data.contactInfo.empnm || '임창순';
        document.getElementById('empmail').value = data.contactInfo.empmail || 'fire@naeiltour.co.kr';
        document.getElementById('emptel').value = data.contactInfo.emptel || '02-6262-5301';
    }
    showToast("견적서 데이터가 성공적으로 복원되었습니다.");
}

function manualParseAndRestore(doc) {
    // This is a placeholder for more complex DOM parsing if no JSON data is found.
    // It's highly recommended to rely on the embedded JSON data.
    showToast("HTML에서 부분적으로 데이터를 복원했습니다 (제한적 기능).", 4000);
}

function generatePreviewHTML(isForFileSave = false) {
    let previewHTML = ``;
    if (isForFileSave) {
         previewHTML += `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>내일투어 견적서</title>`;
    } else {
         previewHTML += `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>견적서 미리보기</title>`;
    }

    previewHTML += `<link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">`;
    previewHTML += `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.2.1/css/all.min.css">`;
    previewHTML += `<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap" rel="stylesheet">`;
    
    previewHTML += `<style>`;
    let editorStyles = "";
    document.querySelectorAll('style').forEach(styleTag => { editorStyles += styleTag.innerHTML; });
    
    editorStyles = editorStyles.replace(/\.group-action-buttons[\s\S]*?}/g, '')
                             .replace(/\.delete-dynamic-section-btn[\s\S]*?}/g, '')
                             .replace(/\.tab-delete-icon[\s\S]*?}/g, '')
                             .replace(/#addGlobalQuoteGroupBtn[\s\S]*?}/g, '')
                             .replace(/\.quote-tab-button .tab-title[\s\S]*?}/g, '.preview-tab-button .tab-title {}') // .tab-title 스타일은 유지하되, 편집기 전용 선택자 회피
                             .replace(/\.quote-tab-button(?!\.active)[\s\S]*?}/g, '') // .quote-tab-button이지만 .active가 아닌 것 제거 (중복 방지)
                             .replace(/\.quote-tab-button\.active[\s\S]*?}/g, '')   // .quote-tab-button.active 제거 (중복 방지)
                             .replace(/\.quote-group-section(?!\.active)[\s\S]*?}/g, '')
                             .replace(/\.quote-group-section\.active[\s\S]*?}/g, '');
    previewHTML += editorStyles;

    previewHTML += `
        body.preview-mode { padding: 1rem; background-color: #f0f0f0; }
        .preview-container { max-width: 950px; margin: 0 auto; background-color: white; padding: 1.5rem; box-shadow: 0 0 10px rgba(0,0,0,0.1); border-radius: 8px; }
        /* --- 이미지 헤더 스타일 추가 --- */
        .preview-image-header { text-align: center; margin-bottom: 1rem; }
        .preview-image-header img { max-width: 100%; height: auto; display: block; margin-left: auto; margin-right: auto; }
        .preview-image-header img.new_header_style { margin-bottom: 10px; } /* 필요시 이미지 간 간격 조정 */
        /* ------------------------------ */
        .preview-section-title { font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem; padding: 0.5rem; background-color: transparent; color: #000; border-radius: 4px; }
        .preview-sub-group-title { font-size: 1rem; font-weight: 600; margin-bottom: 0.5rem; padding: 0.25rem; background-color: #f9f9f9; border-left: 3px solid #4A90E2; }
        .preview-table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; font-size: 0.875rem; }
        .preview-table th, .preview-table td { border: 1px solid #ddd; padding: 0.5rem; text-align: left; }
        .preview-table th { background-color: #f8f9fa; }
        .preview-table td.text-right { text-align: right; }
        .preview-table td.text-center { text-align: center; }
        .preview-textarea-content { white-space: pre-wrap; padding: 0.5rem; border: 1px solid #eee; background-color: #fdfdfd; border-radius: 4px; min-height: 50px; }
        .preview-detailed-itinerary-title { font-size: 1.1rem; font-weight: bold; margin-bottom: 0.5rem; padding: 0.5rem; background-color: #e1e1e1; color: #000; border-radius: 4px; }
        
        .preview-tab-buttons-container {
            display: flex;
            flex-wrap: wrap;
            border-bottom: 1px solid #d1d5db; /* Tailwind gray-300 */
            margin-bottom: 1rem;
            padding: 0 0.5rem; /* 좌우 약간의 여백 */
        }
        .preview-tab-button {
            padding: 0.6rem 1rem; /* 패딩 조정 */
            margin-right: 0.25rem;
            margin-bottom: -1px;
            border: 1px solid #d1d5db;
            border-bottom: none;
            border-radius: 0.375rem 0.375rem 0 0;
            background-color: #f9fafb;
            font-size: 0.875rem; /* 글꼴 크기 */
            color: #374151;
            cursor: pointer;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 220px; /* 탭 최대 너비 */
            transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out;
            line-height: 1.5; /* 줄 높이 추가 */
        }
        .preview-tab-button .tab-title { display: inline-block; vertical-align: middle; }
        .preview-tab-button:hover { background-color: #f3f4f6; color: #1f2937; }
        .preview-tab-button.active { background-color: #ffffff; border-color: #d1d5db #d1d5db #ffffff; font-weight: 600; color: #007bff; position: relative; z-index: 1; }
        .preview-tab-panel { display: none; }
        .preview-tab-panel.active { display: block; }
        
        .preview-mode .preview-group-wrapper {
            border-top-left-radius: 0 !important; 
            border-width: 2px !important; /* 편집기와 동일하게 유지 */
            border-style: solid !important;
            /* background-color: #f9f9f9 !important; /* 편집기 패널과 유사하게 */
            /* padding: 1.5rem !important; */ /* 기존 일반 패딩 */
            padding: 0.3rem !important; /* 모바일/일반 공통 적용을 위해 수정 (모바일에서 너무 넓어지는 것 방지) */
        }
        .preview-mode .preview-sub-group-title {
            border-left: none !important;
            max-width: 100%; 
        }
    </style></head><body class="preview-mode saved-html-view">`; 
    previewHTML += `<div class="preview-container">`;

    // --- 이미지 헤더 삽입 ---
    previewHTML += `<div class="preview-image-header">`;
    previewHTML += `<img src="https://www.naeiltour.co.kr/mail/images/new_header.gif" alt="내일투어 헤더" class="new_header_style">`;
    previewHTML += `<img src="https://www.naeiltour.co.kr/mail/reservation/images/2023_mailtop.gif" alt="예약 메일탑">`;
    previewHTML += `</div>`;
    // ------------------------

    previewHTML += `<header class="mb-6 border-b pb-4 border-gray-200"><h1 class="text-3xl font-bold text-center" style="color: #000;">내일투어 여행견적서 ${isForFileSave ? '' : '(미리보기)'}</h1></header>`;

    // 1. Basic Info
    previewHTML += `<section class="mb-8"><h2 class="preview-section-title">기본 정보</h2><div class="bg-gray-50 p-4 rounded">`;
    previewHTML += `<p><strong>고객명:</strong> ${document.getElementById('customerName').value || 'N/A'}</p>`;
    previewHTML += `<p><strong>이메일:</strong> ${document.getElementById('customerEmail').value || 'N/A'}</p>`;
    previewHTML += `<p><strong>참조:</strong> ${document.getElementById('custcmail').value || 'N/A'}</p>`;
    previewHTML += `<p><strong>메일제목:</strong> ${document.getElementById('subject').value || 'N/A'}</p>`;
    previewHTML += `<p><strong>안내사항:</strong></p><div class="preview-textarea-content">${document.getElementById('introText').value.replace(/\n/g, '<br>') || 'N/A'}</div>`;
    previewHTML += `<p class="mt-2"><strong>상품명 (공통):</strong> ${document.getElementById('goodnm').value || 'N/A'}</p>`;
    previewHTML += `</div></section>`;

    // 2. Traveler Info
    previewHTML += `<section class="mb-8"><h2 class="preview-section-title">예약자 정보</h2><div class=" p-4 rounded">`;
    previewHTML += `<div class="preview-textarea-content">${document.getElementById('travelerInfoText').value.replace(/\n/g, '<br>') || 'N/A'}</div>`;
    previewHTML += `</div></section>`;

    // 3. Quote Groups (탭 인터페이스 적용)
    const groupKeys = Object.keys(quoteGroupDataStore).sort((a, b) => parseInt(a) - parseInt(b));
    
    if (groupKeys.length > 0) {
        // 탭 버튼 컨테이너
        previewHTML += `<div class="preview-tab-buttons-container">`;
        groupKeys.forEach((groupIndex, idx) => {
            const groupData = quoteGroupDataStore[groupIndex];
            if (!groupData) return;
            const isActive = idx === 0; 
            previewHTML += `<button type="button" 
                                    class="preview-tab-button ${isActive ? 'active' : ''}" 
                                    onclick="showPreviewTab('previewTabPanel_${groupIndex}', this)" 
                                    style="border-top: 3px solid ${groupData.borderColor || '#ccc'};">`;
            previewHTML += `<span class="tab-title">${groupData.groupTitle || `견적 ${parseInt(groupIndex) + 1}`}</span>`;
            previewHTML += `</button>`;
        });
        previewHTML += `</div>`;

        // 탭 패널 컨테이너
        previewHTML += `<div class="preview-tab-panels-container">`;
        groupKeys.forEach((groupIndex, idx) => {
            const groupData = quoteGroupDataStore[groupIndex];
            if (!groupData) return;
            const isActive = idx === 0;
            
            previewHTML += `<section id="previewTabPanel_${groupIndex}" 
                                     class="preview-tab-panel preview-group-wrapper ${isActive ? 'active' : ''}" 
                                     style="border-color: ${groupData.borderColor || '#ccc'};">`;

            if (groupData.priceSubgroups && groupData.priceSubgroups.length > 0) {
                previewHTML += `<div class="mb-6"><h4 class="preview-sub-group-title">요금 안내</h4>`;
                groupData.priceSubgroups.forEach(subgroup => {
                    previewHTML += `<div class="mb-4">`;
                    if (subgroup.title) previewHTML += `<p class="font-semibold mb-1">${subgroup.title}</p>`;
                    previewHTML += `<table class="preview-table"><thead><tr><th>내역</th><th>1인당 금액</th><th>인원</th><th>총 금액</th><th>비고</th></tr></thead><tbody>`;
                    let subGrandTotal = 0;
                    subgroup.rows.forEach(row => {
                        const perPrice = parseFloat(row.perPrice) || 0;
                        const number = parseInt(row.number) || 0;
                        const rowTotal = perPrice * number;
                        subGrandTotal += rowTotal;
                        previewHTML += `<tr>
                            <td>${row.title || ''}</td><td class="text-right">${perPrice.toLocaleString()}</td>
                            <td class="text-center">${number}</td><td class="text-right">${rowTotal.toLocaleString()}</td>
                            <td>${row.bigo || ''}</td></tr>`;
                    });
                    previewHTML += `</tbody><tfoot><tr><td colspan="3" class="text-right font-bold">소계</td><td class="text-right font-bold">${subGrandTotal.toLocaleString()}</td><td></td></tr></tfoot></table></div>`;
                });
                previewHTML += `</div>`;
            }

            previewHTML += `<div class="mb-6"><h4 class="preview-sub-group-title">포함/불포함 사항</h4><div class="grid grid-cols-1 md:grid-cols-2 gap-4">`;
            previewHTML += `<div><h5 class="font-semibold mb-1">포함</h5><div class="preview-textarea-content">${(groupData.inclusionExclusion.includedTextarea || '').replace(/\n/g, '<br>') || 'N/A'}</div></div>`;
            previewHTML += `<div><h5 class="font-semibold mb-1">불포함</h5><div class="preview-textarea-content">${(groupData.inclusionExclusion.excludedTextarea || '').replace(/\n/g, '<br>') || 'N/A'}</div></div>`;
            previewHTML += `</div></div>`;

            if (groupData.flightSubgroups && groupData.flightSubgroups.length > 0) {
                previewHTML += `<div class="mb-6"><h4 class="preview-sub-group-title">항공 스케줄</h4>`;
                groupData.flightSubgroups.forEach(subgroup => {
                    previewHTML += `<div class="mb-4">`;
                    if (subgroup.title) previewHTML += `<p class="font-semibold mb-1">${subgroup.title}</p>`;
                    previewHTML += `<table class="preview-table"><thead><tr><th>편명</th><th>출발일</th><th>출발지</th><th>출발시간</th><th>도착일</th><th>도착지</th><th>도착시간</th></tr></thead><tbody>`;
                    subgroup.rows.forEach(row => {
                        previewHTML += `<tr><td>${row.flightNum || ''}</td><td>${row.depDate || ''}</td><td>${row.originCity || ''}</td><td>${row.depTime || ''}</td><td>${row.arrDate || ''}</td><td>${row.destCity || ''}</td><td>${row.arrTime || ''}</td></tr>`;
                    });
                    previewHTML += `</tbody></table></div>`;
                });
                previewHTML += `</div>`;
            }

            if (groupData.itinerarySummaryRows && groupData.itinerarySummaryRows.length > 0) {
                previewHTML += `<div class="mb-6"><h4 class="preview-sub-group-title">간단일정</h4>`;
                previewHTML += `<table class="preview-table"><thead><tr><th>일수</th><th>날짜</th><th>출발지</th><th>도착지</th><th>숙박</th><th>이동</th><th>비고</th></tr></thead><tbody>`;
                groupData.itinerarySummaryRows.forEach(row => {
                    previewHTML += `<tr><td>${row.dayNo || ''}</td><td>${row.dayDate || ''}</td><td>${row.sCity || ''}</td><td>${row.eCity || ''}</td><td>${row.hotel || ''}</td><td>${row.traffic || ''}</td><td>${row.bigo || ''}</td></tr>`;
                });
                previewHTML += `</tbody></table></div>`;
            }

            // --- 상세일정 섹션 수정 ---
            if (groupData.detailedItinerary && groupData.detailedItinerary.days && groupData.detailedItinerary.days.length > 0) {
                previewHTML += `<div class="mb-6">`; // 이 div는 섹션 전체를 감싸는 용도.
                // generateReadOnlyHTMLViewForQuoteGroup 함수가 자체적으로 헤더(<header><h1>...</h1></header>)를 포함하므로
                // 별도의 <h4 class="preview-sub-group-title">는 여기서는 사용하지 않습니다.
                previewHTML += generateReadOnlyHTMLViewForQuoteGroup(groupIndex);
                previewHTML += `</div>`;
            }
            // 데이터가 없는 경우 (위 if 조건 불충족 시), 이 섹션은 아예 HTML에 추가되지 않습니다.
            // 기존의 else 블록 (상세 일정이 없습니다 메시지 출력 부분)이 제거되었습니다.
            // ------------------------

            previewHTML += `</section>`; 
        });
        previewHTML += `</div>`; // End .preview-tab-panels-container
    } else {
        previewHTML += `<p>견적 내용이 없습니다.</p>`;
    }


    previewHTML += `<section class="mb-8"><h2 class="preview-section-title">담당자 정보</h2><div class="bg-gray-50 p-4 rounded">`;
    previewHTML += `<p><strong>담당자:</strong> ${document.getElementById('empnm').value || 'N/A'}</p>`;
    previewHTML += `<p><strong>담당자메일:</strong> ${document.getElementById('empmail').value || 'N/A'}</p>`;
    previewHTML += `<p><strong>연락처:</strong> ${document.getElementById('emptel').value || 'N/A'}</p>`;
    previewHTML += `</div></section>`;
    previewHTML += `</div>`; // End .preview-container
     previewHTML += `
        <script>
            function showPreviewTab(panelIdToShow, clickedButton) {
                var i;
                var tabPanels = document.getElementsByClassName("preview-tab-panel");
                for (i = 0; i < tabPanels.length; i++) {
                    tabPanels[i].classList.remove("active");
                }
                var tabButtons = document.getElementsByClassName("preview-tab-button");
                for (i = 0; i < tabButtons.length; i++) {
                    tabButtons[i].classList.remove("active");
                }
                var panelToShow = document.getElementById(panelIdToShow);
                if (panelToShow) {
                    panelToShow.classList.add("active");
                }
                if (clickedButton) {
                    clickedButton.classList.add("active");
                }
            }

            function toggleDayView(headerElement) {
                const contentWrapper = headerElement.nextElementSibling;
                if (contentWrapper) {
                    contentWrapper.classList.toggle('hidden');
                }
            }
            /*
            document.addEventListener('DOMContentLoaded', function() {
               const firstTabButton = document.querySelector('.preview-tab-buttons-container .preview-tab-button');
               if(firstTabButton) {
                   // If CSS already handles the first active tab, this might not be strictly necessary
                   // but can ensure behavior if CSS loading is delayed.
                   // Example: showPreviewTab('previewTabPanel_' + firstTabButton.dataset.groupIndex, firstTabButton);
                   // Or, if the onclick attribute is set like "showPreviewTab('panelId', this)":
                   // const panelId = firstTabButton.getAttribute('onclick').match(/'([^']+)'/)[1];
                   // showPreviewTab(panelId, firstTabButton);
               }
            });
            */
        <\/script>`;
    previewHTML += `</body></html>`;
    return previewHTML;
}

function previewQuote() {
    const previewHtmlContent = generatePreviewHTML(false);
    const previewWindow = window.open('', '_blank');
    if (previewWindow) {
        previewWindow.document.open();
        previewWindow.document.write(previewHtmlContent);
        previewWindow.document.close();
        previewWindow.focus();
    } else {
        alert('팝업 차단 기능이 활성화되어 미리보기를 열 수 없습니다. 팝업 차단을 해제해주세요.');
    }
}

function downloadGeneratedHTML(isPurePreview = false) { // isPurePreview: true for preview-only, false for data-included
    const mainContainer = document.querySelector('body > .container');
    if (!mainContainer) {
        showToast("메인 컨테이너를 찾을 수 없습니다.", 3000, true);
        return;
    }

    let finalHtmlString = generatePreviewHTML(true); // Generate base HTML for file saving
    const customerName = document.getElementById('customerName').value.trim() || '고객님';
    let fileName = `내일투어_견적서_${customerName.replace(/[^a-z0-9가-힣]/gi, '_')}_${new Date().toISOString().slice(0,10)}`;


    if (!isPurePreview) { 
        const fullDataToEmbed = getAllEditorDataAsObject();
        const safeDataString = JSON.stringify(fullDataToEmbed).replace(/<\/script>/g, '<\\/script>');
        const dataScript = `<script type="application/json" id="fullQuoteData">${safeDataString}<\/script>`;
        finalHtmlString = finalHtmlString.replace('</body>', `${dataScript}</body>`);
        fileName += "_데이터포함.html";
        showToast('견적서가 HTML 파일로 저장되었습니다. (데이터 포함)');
    } else {
        fileName += "_미리보기용.html";
        showToast('미리보기용 견적서가 HTML 파일로 저장되었습니다.');
    }


    const blob = new Blob([finalHtmlString], { type: 'text/html;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}
function getMobileStylesForDownload() { 
    let styles = "";
    document.querySelectorAll('style').forEach(styleTag => {
        if (!styleTag.innerHTML.includes('@page')) {
            styles += styleTag.innerHTML;
        }
    });
     styles += `
    .saved-html-view .group-action-buttons,
    .saved-html-view .add-price-subgroup-button,
    .saved-html-view .add-flight-subgroup-button,
    .saved-html-view .add-itinerary-row-to-group,
    .saved-html-view .load-detailed-itinerary-html-btn,
    .saved-html-view .load-detailed-itinerary-excel-btn,
    .saved-html-view .add-detailed-itinerary-day-button,
    .saved-html-view .delete-dynamic-section-btn,
    .saved-html-view .delete-row,
    .saved-html-view .add-price-row-to-subgroup,
    .saved-html-view .add-flight-row-to-subgroup,
    .saved-html-view #activityModal,
    .saved-html-view .modal-backdrop,
    .saved-html-view .edit-detailed-date-button,
    .saved-html-view .save-detailed-date-button,
    .saved-html-view .cancel-detailed-date-edit-button,
    .saved-html-view .load-detailed-day-html-button,
    .saved-html-view .card-actions-direct,
    .saved-html-view #addGlobalQuoteGroupBtn,
    .saved-html-view footer button,
    .saved-html-view footer input,
    .saved-html-view .price-section-wrapper .add-price-subgroup-button,
    .saved-html-view .flight-schedule-section-wrapper .add-flight-subgroup-button,
    .saved-html-view .itinerary-summary-section-wrapper .add-itinerary-row-to-group,
    .saved-html-view .itinerary-planner-styles .edit-detailed-date-button,
    .saved-html-view .itinerary-planner-styles .save-detailed-date-button,
    .saved-html-view .itinerary-planner-styles .cancel-detailed-date-edit-button,
    .saved-html-view .itinerary-planner-styles .load-detailed-day-html-button,
    .saved-html-view .itinerary-planner-styles .card-actions-direct,
    .saved-html-view .itinerary-planner-styles .add-activity-to-day-button,
    .saved-html-view .itinerary-planner-styles .delete-detailed-day-button,
    .saved-html-view .itinerary-planner-styles .date-edit-input,
    .saved-html-view .itinerary-planner-styles .toggle-detailed-day-collapse-button,
    .saved-html-view .itinerary-detail-section-wrapper .action-button-sm:not(.save-detailed-itinerary-html-btn):not(.save-detailed-day-html-btn)
    { display: none !important; }

    .saved-html-view .quote-group-section { padding-top: 1rem !important; border-width: 2px !important; }
    /* day-header-container, title, svg 아이콘 스타일은 이미 @media print, .saved-html-view 블록에 정의됨 */
    
    .saved-html-view .itinerary-planner-styles .activity-card, .saved-html-view .readonly-activity-card { border: 1px solid #ccc; box-shadow: none; padding: 0.5rem; margin-top: 0.5rem; margin-bottom: 0; page-break-inside: avoid; display: flex !important; }
    .saved-html-view .itinerary-planner-styles .card-location a { text-decoration: none; color: black; }
    .saved-html-view .readonly-collapse-button { display: inline-block !important; }
    .saved-html-view .day-toggle-button-static { display: inline-flex !important; align-items:center; justify-content:center; } 
    `;
    return styles;
}

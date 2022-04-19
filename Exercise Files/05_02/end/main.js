(function(){
	const bodyEle = document.body,
	tableEle = document.createElement("TABLE");
	tableEle.className = "table";
	let data = [],
	originalData = [],
	columnSummary={}
	sorters = [],
	headers = [];
	function tableInit(){
		const sortingWell = document.createElement("DIV");
		const container = document.createElement("DIV");
		const resetBtn = document.getElementById("reset");
		resetBtn.addEventListener("click", () => {
			data = originalData;
			while (tableEle.firstChild) {
				tableEle.removeChild(tableEle.firstChild);
			}
			while (sortingWell.firstChild) {
				sortingWell.removeChild(sortingWell.firstChild);
			}
			createTable()
		})
		container.className = "tableContainer"
		sortingWell.className = "border bg-light p-3 sortWell";
		sortingWell.addEventListener("drop", drop);
		sortingWell.addEventListener("dragover", allowDrop);
		bodyEle.appendChild(sortingWell);
		const url = "./factbook.json";
		fetch(url) 
			.then((response)=> {
				if (response.ok) {
					return response.json();
				}else{
					throw new Error('something went wrong!')
				}
			})
			.then((results) => {
				data = results;
				originalData = results;
				columnSummary = minMaxMean(results);
			})
			.then(() => {
 				createTable()
			})
			.then(() => {
				container.appendChild(tableEle)
				bodyEle.appendChild(container);
			})
			.catch((err) => {
					console.log(err);
			});
	}
	function createTable(){
		createHeader();
		createTableBody();
	}
	function createHeader(){
		const trEle = document.createElement("TR");
		const firstRow = data[0];
		// ES5 Object.keys
		headers = Object.keys(firstRow);
		headers.forEach((key, i) => {
			const thEle = document.createElement("TH"),
			btnEle = document.createElement("BUTTON");
			btnEle.className = 'btn btn-default ml-2'
			btnEle.innerText = key;
			// ES6 template literals
			btnEle.id = `sorter-${i}`;
			btnEle.draggable = true;
			btnEle.addEventListener("dragstart", dragstart);
			thEle.appendChild(btnEle);
			trEle.appendChild(thEle);
			if(i === 0){
				thEle.className = "fixed";
			}else{
				thEle.className = "pushRight";
			}
		})
		tableEle.appendChild(trEle);
	}
	function createTableBody(){	
		data.forEach((row) => {
			const trEle = document.createElement("TR")
			Object.entries(row).forEach((entry, i) => {
				const key = entry[0],
				val = entry[1],
				tdEle = document.createElement("TD");
				tdEle.innerText = val;
				const iEle = document.createElement("i");
				iEle.className = "fas mainIcon";
				if(key === "Population growth rate"){
					if(val > 0){
						iEle.className = "fas fa-arrow-up"
					}
					if(val < 0){
						iEle.className = "fas fa-arrow-down"
					}
				}
				tdEle.appendChild(iEle)
				if(i === 0){
					tdEle.className = "fixed";
				}else{
					tdEle.className = "pushRight " + key.toLowerCase().replace(/-/g, '').replace(/ /g, '_');
				}
				trEle.appendChild(tdEle);
			})
			tableEle.appendChild(trEle)
		})
	}
	function allowDrop(ev) {
		ev.preventDefault();
		ev.stopPropagation();
	}
	function dragstart(ev) {
		ev.dataTransfer.setData("text", ev.currentTarget.id);
		// Here I clone the button because A node can only exist once in the DOM and when 
		// you append it somewhere else, it removes it from the original location.
		// So, when you append the button on drop, it automatically removes it from the TH.
		var clonedBtn = ev.target.cloneNode(true);
		clonedBtn.id = `${clonedBtn.id}-cloned`
		clonedBtn.disabled = true;
		clonedBtn.style.display = "none";
		ev.currentTarget.parentNode.appendChild(clonedBtn)
	}
	function drop(ev) {
		var transferData = ev.dataTransfer.getData("text");
		const dragBtn = document.getElementById(transferData);
		const clonedBtn = document.getElementById(`${transferData}-cloned`);
		ev.currentTarget.appendChild(dragBtn);	
		clonedBtn.style.display = "block";
		sorters.length = 0;
		event.currentTarget.childNodes.forEach((item) => {
			sorters.push(item.innerText);
		})
		sorters.reverse();
		const sorterIndex = headers.indexOf(sorters[0]);
		const itemsNotNull = filterNull(sorterIndex);
		switch(getSort()){
			case "regular":
				console.profile("regularSort");
				const regularArr = regularSort(itemsNotNull, sorterIndex);
				renderNodes(regularArr);
				console.profileEnd("regularSort");
				break;
			case "bubble":
				console.profile("bubbleSort");
				const bubbleArr = bubbleSort(itemsNotNull, sorterIndex);
				renderNodes(bubbleArr);
				console.profileEnd("bubbleSort");
				break;
			case "merge":
				console.profile("mergeSort");
				const mergeArr = mergeSort(itemsNotNull);
				renderNodes(mergeArr);
				console.profileEnd("mergeSort");
				break;
			case "insertion":
				console.profile("insertionSort");
				const insertionArr = insertionSort(itemsNotNull, sorterIndex);
				renderNodes(insertionArr);
				console.profileEnd("insertionSort");
				break;
			case "quartile":
				console.profile("quartileSort");
				sorters.forEach((sorter) => {
					quartileSort(sorter)
				});
				console.profileEnd("quartileSort");
				break;
			default:
				console.profile("regularSort");
				regularSort();
				console.profileEnd("regularSort");
		}
	}
	function regularSort(arr, sorterIndex){
		arr.sort((a, b) => {
			const rowA = Array.from(a.childNodes);
			const rowB = Array.from(b.childNodes);

			const x = parseFloat(rowA[sorterIndex].textContent);
			const y = parseFloat(rowB[sorterIndex].textContent);
			return x < y ? -1 : (x > y) ? 1 : 0;
		});
		return arr;
	}
	function bubbleSort(arr, sorterIndex) {
		let swapped;
		do{
			swapped = false;
			for(let i = 0; i < arr.length; i++){
				const j = i + 1;
				if(arr[i] && arr[j]){
					const rowA = Array.from(arr[i].childNodes);
					const rowB = Array.from(arr[j].childNodes);

					const x = parseFloat(rowA[sorterIndex].textContent);
					const y = parseFloat(rowB[sorterIndex].textContent);
					if(x > y){
						var temp = arr[i];
						arr[i] = arr[j];
						arr[j] = temp;
						swapped = true;
					}
				}
			}
		}while(swapped)
		return arr
	}
	function mergeSort (arr) {
		if(arr.length <= 1){
			return arr;
		}
		const middle = Math.floor(arr.length / 2),
		left = arr.slice(0, middle),
		right = arr.slice(middle);
		return merge(
			mergeSort(left),
			mergeSort(right)
		)
	}
	
	function merge (left, right) {
		let results = [],
		indexLeft = 0,
		indexRight = 0;
		const sorterIndex = headers.indexOf(sorters[0]);
		while(indexLeft < left.length & indexRight < right.length){
			const rowA = Array.from(left[indexLeft].childNodes);
			const rowB = Array.from(right[indexRight].childNodes);

			const x = parseFloat(rowA[sorterIndex].textContent);
			const y = parseFloat(rowB[sorterIndex].textContent);
			if(x < y){
				results.push(left[indexLeft]);
				indexLeft++;
			}else{
				results.push(right[indexRight]);
				indexRight++;
			}
		}
		return results.concat(left.slice(indexLeft)).concat(right.slice(indexRight))
	}
	function insertionSort (arr, sorterIndex) {
		for(let i = 1; i < arr.length; i++){
			const rowA = Array.from(arr[i].childNodes);
			const x = parseFloat(rowA[sorterIndex].textContent);
			const currentValue = arr[i];
			let j;
			for(j = i - 1; j >= 0; j--){
				const rowB = Array.from(arr[j].childNodes);
				const y = parseFloat(rowB[sorterIndex].textContent);
				if(y <= x){
					break;
				}else{
					arr[j + 1] = arr[j]
				}
			}
			arr[j + 1] = currentValue;
		}
		return arr;
	}
	function quartileSort(sorter){
		const nodes = Array.from(tableEle.childNodes);
		nodes.shift();
		const firstBuckets = splitQuartiles(nodes, sorter);
		nodes.length = 0;
		firstBuckets.forEach((bucket) => {
			const secondBuckets = splitQuartiles(bucket, sorter);
			bucket.length = 0;
			secondBuckets.forEach((secbucket) => {
				const sorterIndex = headers.indexOf(sorter);
				if(sorters[0] === sorter){
					if(sorters.length > 1 ){
						secbucket.sort((a, b) => { 
							const rowA = Array.from(a.childNodes);
							const rowB = Array.from(b.childNodes);
							const x = parseFloat(rowA[sorterIndex].innerText);
							const y = parseFloat(rowB[sorterIndex].innerText);
							if(!isNaN(x) || !isNaN(y)){
								return x < y ? 1 : (x > y) ? -1 : 0;
							}else{
								return -1
							}
						})
					}else{
						regularSort(secbucket, sorterIndex)
					}
				}
				secbucket.forEach((currentVal) => {
					bucket.push(currentVal)
				});
			});
			if(sorters.length > 1){
				bucket.reverse()
			}
			bucket.forEach( (element) => {
				nodes.push(element);
			});
		});
		renderNodes(nodes)
	}
	function splitQuartiles (nodes, sorter){
		let allBuckets = [[],[],[],[],[]];
		const sorterIndex = headers.indexOf(sorter);
		nodes.forEach( (currentVal) => {
			const rowA = Array.from(currentVal.childNodes);
			const x = parseFloat(rowA[sorterIndex].innerText);
			if(!isNaN(x)){
				if(x >= columnSummary[sorter].min && x <= columnSummary[sorter].first){
					allBuckets[1].push(currentVal);
				}
				if(x > columnSummary[sorter].first && x <= columnSummary[sorter].mean){
					allBuckets[2].push(currentVal);
				}
				if(x > columnSummary[sorter].mean && x <= columnSummary[sorter].third){
					allBuckets[3].push(currentVal);
				}
				if(x > columnSummary[sorter].third && x <= columnSummary[sorter].max){
					allBuckets[4].push(currentVal);
				}
			}else{
				allBuckets[0].push(currentVal);
			}
		});
		return allBuckets
	}
	function renderNodes(arr){
		const reverse = document.getElementById("reverse").checked;
		if(reverse){
			arr.reverse()
		}
		arr.forEach((row) => {
			const tds = row.childNodes;
			const tdsArr = Array.from(row.childNodes)
			tdsArr.forEach((td) =>{
				const classListArr = Array.from(td.classList);
				sorters.forEach((sorter) => {
					const sorterVal = sorter.toLowerCase().replace(/-/g, '').replace(/ /g, '_');
					if(classListArr.includes(sorterVal)){
						const tdVal = parseFloat(td.textContent);
						heatMapColor(td, tdVal, sorter);
					}
				})
			})
			tableEle.insertBefore(row, tableEle.childNodes[1])
		})
	}
	function getSort(){
		const sortSelector = document.getElementById("sort_selector").children;
		const sortSelectorArr = Array.from(sortSelector);
		let sorter = ""
		sortSelectorArr.forEach((btn) =>{
			if(btn.classList.contains("active")){
				sorter = btn.children[0].value;
			}
		});
		return sorter;
	}
	function filterNull(sorterIndex){
		const items = Array.from(tableEle.childNodes);
		return items.filter((row) => {
			const rowTD = Array.from(row.childNodes);
			return rowTD[sorterIndex].textContent; 
		})
	}
	function minMaxMean(items) {
		let summary = {},
			minVal = null,
			maxVal = null,
			meanVal = null,
			firstQuartile = null,
			thirdQuartile = null;
		const headers = Object.keys(items[0]);
		headers.forEach((header) => {
			let tempArr = [];
			items.forEach((item, i) => {
				if(item[header] !== null){
					tempArr.push(item[header]);
					if(i === items.length - 1){
						tempArr.sort((a, b) => a < b ? -1 : (a > b) ? 1 : 0 );
						minVal = Math.min(...tempArr);
						maxVal = Math.max(...tempArr);
						meanVal = tempArr[Math.floor(tempArr.length/2)];
						firstQuartile = tempArr[Math.floor(tempArr.length/4)];
						thirdQuartile = tempArr[Math.floor((tempArr.length/4)*3)];
					}
				}
			})
			summary[header] = {
				values: tempArr,
				min: minVal,
				max: maxVal,
				mean: meanVal,
				first: firstQuartile,
				third: thirdQuartile
			}
		});
		console.log(summary)
		return summary
	}
	function heatMapColor(ele, val, key){
		let color = '';
		const currentColumn = columnSummary[key],
		red = "rgb(253,92,1)",
		orange = "rgb(252,168,33)",
		green = "rgb(167,199,108)",
		blue = "rgb(111,183,149)",
		white= "rgb(255,255,255)";
		if(val >= currentColumn.min && val <= currentColumn.first){
			color = red;
		}
		else if(val > currentColumn.first && val <= currentColumn.mean){
			color = orange
		}
		else if(val > currentColumn.mean && val <= currentColumn.third){
			color = green;
		}
		else if(val > currentColumn.third && val <= currentColumn.max){
			color = blue;
		}
		else{
			color = white;
		}
		ele.style.backgroundColor = color;
		ele.classList.add("selected");
	}
	
	
	tableInit();
})()
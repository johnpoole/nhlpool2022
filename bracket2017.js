
var JASON_COLOUR = "#f79620";
//field position constants;
//PICKS fields
var YEAR = "2022";
var NAME_COLUMN=15;
var DATA_START=2;
var NUMBER_OF_PICKS=7;
var PROB_COLUMN=17;	

var picks;
var sharedOdds = true;
var games;
var div = d3.select("body").append("div")	
    .attr("class", "tooltip")				
    .style("opacity", 0);
	

readGames();

function readGames(){
	d3.text("games"+YEAR+".csv", function(text){
		games = d3.csv.parseRows(text)
		readPicks();
	});
}

function readPicks(){
	d3.text("picks"+YEAR+".csv", function(data) {
		var oldpicks = d3.csv.parseRows(data);
		picks = [];
		oldpicks.forEach( function(d){
			d = d.slice(0,17);
			d.push(0); //probability column

			picks.push(d);
		});
		readSimulations(picks);
	});
}
var probMap = {};

function readSimulations(picks){
	d3.csv("simulations_recent.csv", function(probabilities) {
		 probabilities = [].map.call(probabilities.filter(function(d){ 
			return  d.scenerio == "ALL" //d.madePlayoffs === "1" &&
		}), function(row) {
			var probGame = [];
			probGame.push( Number(row.round3Winin4) + Number(row.round3Lossin4));
			probGame.push( Number(row.round3Winin5) + Number(row.round3Lossin5));
			probGame.push( Number(row.round3Winin6) + Number(row.round3Lossin7));
			probGame.push( Number(row.round3Winin7)+ Number(row.round3Lossin7));
			var wins = [];
			wins.push( Number(row.round2));
			wins.push( Number(row.round3));
			wins.push( Number(row.round4));
			wins.push( Number(row.wonCup));
			return {
			 gamesHome: 3,//Number(gameText[0]),
			 gamesAway: 2,//Number(gameText[1]),
			 gameNumChance: probGame,
			 team: row.teamCode,
			 win:wins
			};		
		});
		probabilities.forEach(p=> probMap[p.team] = p.win);
		//expectedValue(picks, probabilities);
		calcProbabilityOfWin(picks);
		render(picks, probabilities);
		//cProb( picks, probabilities);
	 });
}


function render( picks, prob1){
	
		  
	renderTable(picks, prob1);
	
	data = picks.filter(function(d){return d[PROB_COLUMN] > 0}).map(function(d){ 
		d.value = d[PROB_COLUMN]; 
		return d; 
	});
    renderCircles(data);
}

function renderTable( picks, prob1){

						                   					
	var headerData = picks[0];	
	var picks_table = d3.select("#picks")
                    .append("table")
					.attr("class","table table-striped table-condensed");
	picks_table.append("thead").append("tr")
					.selectAll("th")
					.data(headerData)
					.enter().append("th")
					.text(function(d) {
						return d;
					});
	var sortedPicks = picks.slice(1).sort(function(a, b) { 
	//	if( b[PROB_COLUMN] == a[PROB_COLUMN])
	//		return b[EV_COLUMN] - a[EV_COLUMN];
		return b[PROB_COLUMN] - a[PROB_COLUMN]; 
	});
	
		var rows = picks_table.append("tbody").selectAll("tr")
            .data(sortedPicks).enter();
                    
			rows.append("tr")
             .selectAll("td")
             .data(function(d) { 
				return d;
			}).enter()
            .append("td")
            .text(function(d,i) { 
	//			if( i == WAYSTOWIN_COLUMN) 
	//				return;							
				if(  i < PROB_COLUMN ){																		
					return d;								
				}
				//if(  i< 32 ){																		
				//	return parseInt(d);								
				//}
				return Number(d).toFixed(1); 
			})
			.attr("class", function(d, i){
			//	if( i == WAYSTOWIN_COLUMN) 
			//		return;
				var classname ="";
				if( isNaN(d, i)){
					var round = 0;
					if( i > 9 ) round =1;
					if( i > 13) round =2;
					if( i == 16 ) round =3;
					classname = teamColor(d, round);					
					return classname;
				}
					
			});

		var table = d3.select("#stats").append('table').attr("class","table table-striped table-condensed");
		var thead = table.append('thead')
		var	tbody_stats = table.append('tbody');
		var columns = ["team","win"];

		// append the header row
		thead.append('tr')
		  .selectAll('th')
		  .data(columns).enter()
		  .append('th')
		    .text(function (column) { 			
				return column;
			});
			
		// create a row for each object in the data
		var rows = tbody_stats.selectAll('tr')
		  .data(prob1.sort(function(a, b) { 
							return b.win[2] - a.win[2]; 
						}).filter(function(d){
			  return d.win[2] > 0;
		  }))
		  .enter()
		  .append('tr');


		// create a cell in each row for each column
		var cells = rows.selectAll('td')
		  .data(function (row) {
			  var ret = [];
			  ret.push( row.team);
			  row.win.forEach( function(w){
				  ret.push( row.team+","+w );
			  });
			  return ret; 
		  })
		  .enter()
		  .append('td')
		  .text(function (d, i) { 
			if( i > 0){	
		  		var odds = d.split(',')[1];
				return odds;

			}
			else{
			  return d;
			}
				
			})
			 .attr("class", function(d, i){
				var classname ="";
				var team = d.split(',')[0];
				if( i > 0){	
					classname = teamColor(team, i-1);					
					return classname;
				}								
			});;
			 //.style("background-color",function(d){ return teamColor(d.value);});
	  
}

function renderCircles(data){
	//bubbles needs very specific format, convert data to this.
	var color = d3.scale.category10(); //color category
	var diameter = 300; //max size of the bubbles
	
	var svg = d3.select("#chart")
    .append("svg")
    .attr("width", diameter)
    .attr("height", diameter)
    .attr("class", "bubble");
	
	var bubble = d3.layout.pack()
    .sort(null)
    .size([diameter, diameter])
    .padding(1.5);
	
    var nodes = bubble.nodes({children:data}).filter(function(d) { return !d.children; });

    //setup the chart
    var bubbles = svg.append("g")
        .attr("transform", "translate(0,0)")
        .selectAll(".bubble")
        .data(nodes.filter(function(d){
			return d.winProbability > 0.01;
		}))
        .enter();

    //create the bubbles
    bubbles.append("circle")
        .attr("r", function(d){ return d.r; })
        .attr("cx", function(d){ return d.x; })
        .attr("cy", function(d){ return d.y; })
        .style("fill", function(d) { 
			if(d[0] == "Jason")
				return JASON_COLOUR;
			return color(d[0]); 
		})
		.on("mouseover", function(d) {		
            div.transition()		
                .duration(200)		
                .style("opacity", .9);		
            div	.html(waysToWinHTML(d) )	
                .style("left", (d3.event.pageX) + "px")		
                .style("top", (d3.event.pageY - 28) + "px");	
            })					
        .on("mouseout", function(d) {		
            div.transition()		
                .duration(200)		
                .style("opacity", 0);	
        });;

    //format the text for each bubble
    bubbles.append("text")
        .attr("x", function(d){ return d.x; })
        .attr("y", function(d){ return d.y + 5; })
        .attr("text-anchor", "middle")
        .html(function(d){ 
			var names = d[0].split("/");
			var html = "";
			var div = "";
			for( var n in names){
				html += div + names[n];
				div = "-";
			}
			return html; 
		})
		.on("mouseover", function(d) {		
            div.transition()		
                .duration(200)		
                .style("opacity", .9);		
            div	.html(waysToWinHTML(d) )	
                .style("left", (d3.event.pageX) + "px")		
                .style("top", (d3.event.pageY - 28) + "px");	
            })					
        .on("mouseout", function(d) {		
            div.transition()		
                .duration(200)		
                .style("opacity", 0);	
        })
		.style( {
            "font-family":"Helvetica Neue, Helvetica, Arial, san-serif",
			"font-size":
			function(d) { 
				return Math.min(2 * d.r, (2 * d.r - 8) / this.getComputedTextLength() * 13) + "px"; 
		}});
}
//content for tooltip popup
function waysToWinHTML(list){
	var ways = "<h3>Ways to win or tie: "+list[WAYSTOWIN_COLUMN ].length+" TOP "+ Math.min(10,list[WAYSTOWIN_COLUMN ].length) +"</h3>";
	ways += "<table class='table ways'>";
	
	var sortedList = list[WAYSTOWIN_COLUMN].sort(function(a, b){return b[14] - a[14];}).slice(0,10);
	for( var i in sortedList){
		ways+="<tr>";
		for( var j in sortedList[i]){
				ways+="<td nowrap>"+sortedList[i][j]+"</td>";
		}
		ways+="</tr>";
	}
	ways += "</table>";

	return ways;
}

//add columns to each person's pick to show their expected value
function expectedValue(picklist ){
	for( var i in picklist){
		var row = picklist[i];
		if( i ==0){
			row.push("EV");
			row.push("P(%)");
			row.push("");
			row.push("current value($)");
		}
		if( i > 0 ){
			var ev = 0;			
			for (var p = DATA_START; p < DATA_START+NUMBER_OF_PICKS; p++) {
				var team = row[p];
				var gameGuess = row[p+7];
				var round = 0;
				if( p - DATA_START>3) round = 1
				if( p - DATA_START == 6 ) round = 2;
				ev += probability(team, round)*3;
//				ev += possibleGames(p, gameGuess);
			}
			row.push(ev);
			row.push(0);
			row.push([]);
			row.push(0);
			row.paid=row[PAID_COLUMN];		
		}
	}
}

function calcProbabilityOfWin(picks) {
	for( var j in picks ){
		picks[j].gameGuess = 0;
	}
	var totalP = 0, count = 0;
	games[0].forEach(function (a) {
		games[1].forEach(function (b) {
			games[2].forEach(function (c) {
				games[3].forEach(function (d) {
					games[4].forEach(function (e) {
						games[5].forEach(function (f) {
							games[6].forEach(function (g) {
								games[7].forEach(function (h) {

									games[8].forEach(function (i) {
										if( i !== a && i != b) return;
										games[9].forEach(function (j) {
											if( j !== c && j != d) return;
											games[10].forEach(function (k) {
												if( k !== e && k != f) return;
												games[11].forEach(function (l) {
													if( l !== g && l != h) return;
													
													games[12].forEach(function (m) {
														if( m !== i && m != j) return;														
														games[13].forEach(function (n) {
															if( n !== k && n != l) return;

															games[14].forEach(function (p) {
																if( p !== m && p != n) return;
//console.log( a+"  "+b+"  "+ c+"  "+ d+"  "+ e+"  "+ f+"  "+ g+"  "+ h+"  "+
	//															i+"  "+ j+"  "+ k+"  "+ l+"  "+ m+"  "+ n+"  "+ p)
																var winners = [a,b, c, d, e, f, g, h,
																i, j, k, l, m, n, p];
																var prob = probOf(winners);
																count++;

																totalP += prob;
																updateWinners(winners, prob);
															});
														});
													});
												});
											});
										});
									});
								});
							});
						});
					});
				});
			});
		});
	});
	console.log( count +" "+totalP);
}

function updateWinners(winners, prob){
	var poolWinnerList = findPoolWinner(winners);
	//console.log( poolWinnerList );
	for( var pi in poolWinnerList){
		var index = parseInt(poolWinnerList[pi]);		
		var pick = picks[index]
		pick[PROB_COLUMN] += prob*100.0;
		pick.winProbability = picks[index][PROB_COLUMN];
	}
}

function possible( winners){
	if( !(winners[4] == winners[0] ||  winners[4] == winners[1]))
		return false;
	if( !(winners[5] == winners[2] ||  winners[5] == winners[3]))
		return false;
	if( !(winners[6] == winners[4] ||  winners[6] == winners[5]))
		return false;
	return true;
}

//should the current "number of games guesses" be included here?
function findPoolWinner(winners){
	var winnerList=[];
	var count = [];//track the "score" for each entry for this combination of winners
	for( j in picks ){
		count[j] = picks[j].gameGuess;
	}
	for( var i =0; i < winners.length; i++){
		var pts = pointsForRound( i )
		for( var t=1;t< picks.length;t++ ){
			var pick = picks[t];
			var pickVal = pick[DATA_START+i];
			if( pickVal == winners[i]){
				count[t]+=pts;
			}
		}
	}
	
	var maxval = 0;
	for( j in picks ){		
		if( count[j] > maxval){
			maxval = count[j];
			winnerList=[];
		}
		if( count[j] == maxval){
			winnerList.push(j);
		}
	}
	return winnerList;
}

function pointsForRound( index){
	var points  = 1;
	if( index > 7) points = 3;
	if( index > 11) points = 5;
	if( index > 13) points = 10;
	return points; 
}

//find the combined probability of the events in the winners array occurring
//this is wrong. It should calculate the probability of the combination of events but include the dependent
//odds
// the probability of a team reaching a later round is dependant on the probability of it making an earlier round
//for example, the odds of a team making the finals isn't the odds it will make each earlier round times the odds it will makes each //later round.
// it's just the odds of the final event
function probOf( winners){
	var  p =1;
	var round;
	var done = [];
	for( var i =winners.length-1; i >=0 ; i--){
		var round=0;
		if( i > 7){
			round =1 ;
		}
		if (i > 11 ){
			round =2;
		}			
		if( i > 13){
			round = 3;
		}
		if( !done.includes( winners[i]) ){
			p*= probability(winners[i], round);
			done.push(winners[i]);
		}
	}
	return p;
}

function probability(team, round){
	return probMap[team][round];
}
	
function teamColor( team, round ){
	if( !probMap[team]) return "";
			 var w = probMap[team][round];
			 if( w == 0 ) return "disabled";
			 else if( w == 1 ) return "won";
			 else if( w < 0.20 ) return "danger";
			 else if( w < 0.50 ) return "warning";
			 else if (w < .80)return "info";
			 else return "success";
		 
}


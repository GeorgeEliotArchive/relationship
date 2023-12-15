/**
 * Global variables
 */

//colors for node backgrounds based on relationship type
let FRIEND_COLOR = "#93c6b1";
let FRIEND_SECONDARY_COLOR = "#def7ed";

let FAMILY_COLOR = "#ff9bb2";
let FAMILY_SECONDARY_COLOR = "#ffe8ed";

let ACQ_COLOR = "#fff09b";
let ACQ_SECONDARY_COLOR = "#fffbe8";

//  var GE_COLOR = '#636363';
// var GE_COLOR = '#bd874a';

let GE_COLOR = "#DAA520";

let SEARCHED_NODE_COLOR = "#701313";

//values for sizing elements
let MAGNIFYING_RATIO = 1.5;
let MARGIN = 20;
//  var WIDTH = document.getElementById("relationshipWeb").offsetWidth;
//  var HEIGHT = document.getElementById("relationshipWeb").offsetHeight;
let WIDTH = 1200;
let HEIGHT = 900;
let USER_MENU_WIDTH_SHOW = "320px";
let USER_MENU_WIDTH_HIDE = "160px";

let IMAGE_R = 80; //radius for biography container

let USER_MENU_SHOWN = true;


async function getMembers() {
  let letterID = '46' 
  let membersList = []
  let letters = []
  let data = []
  // using the Fetch API to get collection info
  const response = await (fetch('https://georgeeliotarchive.org/api/items?collection=19'))
  const members = await response.json()

  // iterates through the JSON to get desired information of each member of the collection  
  for (let i = 0, l = members.length; i < l; i++) {   
      
      for (let j = 0, k = members[i].element_texts.length; j < k; j++) {  
          if (members[i].element_texts[j].element.id == letterID) {  // finds letters by matching ID
              letters[i] = members[i].element_texts[j].text;
              break;
          } 
          else {
              letters[i] = ''
          }  
      }
  let member = {
                "name": members[i].element_texts[0].text,
        "bio": members[i].element_texts[1].text,
        "letters": letters[i]
          }
    membersList.push(member)
    
  }


  for(let i = 0; i < members.length; i++) {
      data.push("\n\"" + membersList[i].name + "\"")
      data.push("\"" + membersList[i].bio + "\"")
      data.push("\"" + membersList[i].letters + "\"")
  }
  data = "FullName,Biography,Letters" + data;
  return data;
}

/**
 * Creates a "pattern" element with the given imagePath and sets the pattern id with the index of the individual.
 *
 * @param {string} image
 * @param {int} index
 */
function setImage(imagePath, index) {
  images
    .append("pattern")
    .attr("id", "image_" + index)
    .attr("width", 1)
    .attr("height", 1)
    .attr("viewBox", "0 0 100 100") //scalable image
    .append("svg:image") //link image
    // .attr('onload', function(){
    //     images.attr("fill", "url(#" + imagePath + ")")
    // })
    .attr("xlink:href", imagePath)
    .attr("width", 100)
    .attr("height", 100)
    .attr("y", 0)
    .attr("x", 0);
}

/**
 * returns a random number between min and max. Used only for generating dummy data.
 * @param {double} min
 * @param {double} max
 */
function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

/**
 * Returns a string combining all the names of the individual.
 * Title FirstName "Nickname" SecondNames LastName
 * @param {JSON object} node
 */
function parseFullName(node) {
  //parse name
  let name = node["Last Name"] + ",";

  name += " " + node["First Name"];

  if (node["Nickname"]) {
    name += ' "' + node["Nickname"] + '"';
  }
  if (node["Second Names"]) {
    name += " " + node["Second Names"];
  }

  // if(node["Title"]) {
  //     name = node["Title"] + " " + name;
  // }

  node["FullName"] = name.replace(/\s*,\s*/g, ", ").trim().replace(/\s+/g, ' ');
  return node;
}

/**
 * Called by a mouseover event on a node.
 * Brings the hovered node to the front, magnifies it by the MAGNIFYING_RATIO, and attaches the individual's name
 * with the id #currentText to the top.
 * @param {D3 Selection} node
 */
function selectNode(node) {
  node.attr("r", function (d) {
    return d.Radius;
  });
  let data = node.data()[0];

  //check that it is not GE
  if (data.index == 0) {
    return;
  }

  //get parent node
  let parent = d3.select(node.node().parentNode);
  //check that its "searched" name tag isn't up
  console.log(parent._groups[0][0].childElementCount);
  if (parent._groups[0][0].childElementCount < 2) {
    //values from node

    let r = node.attr("r");
    //offset r from x and y to prevent overlap with image
    let x = node.attr("cx") - r;
    let y = node.attr("cy") - r;

    //magnify node
    node.attr("r", r * MAGNIFYING_RATIO);
    // node.transition()
    //     .duration(100)
    //     .attr('r', r * MAGNIFYING_RATIO);

    parent.moveToFront();

    let group = parent.append("g").attr("id", "currentText");

    // let x = group.append('body')

    let f = group
      .append("foreignObject")
      .attr("x", x - 30)
      .attr("y", y + (data.Radius / 2) * 4)
      .attr("width", "120px")
      .attr("height", "55px")
      .attr("opacity", 0.1)

      .append("xhtml:div")
      .html(data["FullName"])
      .attr("class", "fullNameNode")
      .attr("class", function () {
        switch (data["Relationship"]) {
          case "friend":
            return "fullNameBorderFriend";
          case "family":
            return "fullNameBorderFamily";
          default:
            return "fullNameBorderBA";
        }
      });

    group.selectAll("foreignObject").transition().duration(500).attr("opacity", 0.8);
  }
}

/**
 * Removes the D3 selections with the id #currentText and resets the radius to the original radius.
 * @param {D3 Selection} node
 */
function deselectNode(node) {
  //remove name
  d3.select("#currentText").remove();
  //revert node size
  node.attr("r", function (d) {
    return d.Radius;
  });
  //  node.transition()
  //         .duration(500)
  //         .attr('r', node.attr('r'));
}

/**
 * Appends a small svg containing biography information to the main svg with the id #currentSummary
 * @param {D3 Selection} node
 */

function showSummary(node) {
  let data = node.data()[0];

  //check that it is not GE
  if (data.index == 0) {
    return;
  }

  clearDisplay();

  if (!USER_MENU_SHOWN) {
    toggleMenu();
  }

  document.getElementById("Biography").style.display = "block";

  switch (data.Relationship) {
    case "family":
      document.getElementById("Biography").classList.add("BiographyFamily");
      break;
    case "friend":
      document.getElementById("Biography").classList.add("BiographyFriend");
      break;
    default:
      document.getElementById("Biography").classList.add("BiographyBA");
      break;
  }
  document.getElementById("CloseButton").style.display = "block";
  d3.select("#BiographyName").append("text").text(data["FullName"]);
  d3.select("#BirthAndDeath").append("text").text(getBirthDeathDates(data["Birth"], data["Death"]));
  d3.select("#BiographySummary")
    .append("text")
    .html(handleBiographyText(data["Biography"].replace(/\"/g, '\\"')));
  if (data.Image) {
    document.getElementById("BiographyPhoto").src = "images/png/" + data.Image;
  } else {
    switch (data.Relationship) {
      case "friend":
        document.getElementById("BiographyPhoto").src = "images/png/nopicture_friend.png";
        break;
      case "family":
        document.getElementById("BiographyPhoto").src = "images/png/nopicture_family.png";
        break;
      default:
        document.getElementById("BiographyPhoto").src = "images/png/nopicture_acquaintence.png";
        break;
      }
  }
  if (data["Letters"]) {
    d3.select("#BiographyLetters")
      .append("text")
      .html(
        "<u>Letters from <i>George Eliot letters</i>, vols 1-9, edited by Gordon Haight (Yale UP, 1954-1978):</u></br>"
      );
    d3.select("#BiographyLetters").append("text").html(data["Letters"]);
  }
  if (data["Links"]) {
    d3.select("#BiographyLinks")
      .append("text")
      .html(
        "<u><br>Links to other resources:</u></br>"
      );
      // adds new links depending on how many there are. 
      // use space separations to add more links.
      strLinks = data["Links"].split(/[ ]+/);
      for(var i = 0; i < strLinks.length; i++) {
        console.log(strLinks[i]);
        d3.select("#BiographyLinks").append("text").html('<a id="hyperlink" href="#"></a>');
        getUrl(strLinks[i], i+1);
      }
    }
      
}

/**
 * Gets url and updates hyperlink if person has relevant links
 * 
 */
function getUrl(link, index) {
  var hyperlink = document.getElementById("hyperlink");
  hyperlink.href = link;
  hyperlink.innerText = "[" + index + "]";
}

/**
 * If there is no biography present for an indual, the function returns 'No data'.
 * @param {string} biography
 */
function handleBiographyText(biography) {
  return biography ? biography : "No data";
}

/**
 * Removes the element with the id
 */
function clearDisplay() {
  document.getElementById("CloseButton").display = "none";
  document.getElementById("Biography").classList.remove("BiographyFamily");
  document.getElementById("Biography").classList.remove("BiographyFriend");
  document.getElementById("Biography").classList.remove("BiographyBA");
  document.getElementById("BiographyPhoto").src = "";
  document.getElementById("BiographyName").innerHTML = "";
  document.getElementById("BirthAndDeath").innerHTML = "";
  document.getElementById("BiographySummary").innerHTML = "";
  document.getElementById("BiographyLetters").innerHTML = "";
  document.getElementById("BiographyLinks").innerHTML = "";
  document.getElementById("Biography").style.display = "none";
}

/**
 * Returns a string concatenating the birth and death dates.
 * If there is no data for either of the fields, the string 'Unknown' is used instead.
 * @param {string} birth
 * @param {string} death
 */
function getBirthDeathDates(birth, death) {
  if (birth && death) {
    return birth + " - " + death;
  }
}

/**
 * Sets the index of every node. Uses closure to maintain integrity of the index, even with an asynchronous function.
 */
let setIndex = (function (node) {
  let index = 1;
  return function (node) {
    node.index = index;
    index++;
    return node;
  };
})();

/**
 * Moves the selection to the front of the DOM
 */
d3.selection.prototype.moveToFront = function () {
  return this.each(function () {
    this.parentNode.appendChild(this);
  });
};

/**
 * "selects" nodes that match the searchTerm
 */
function filterInput() {
  //remove all currently shown
  d3.selectAll(".searchedText").remove();

  let searchTerm = document.getElementById("searchBar").value;
  //trim and lowercase searchterm
  searchTerm = searchTerm.trim().toLowerCase();
  if (searchTerm.length > 4) {
    let indicies = getIndiciesOfSearchTerm(searchTerm);

    indicies.forEach(function (index) {
      let nodeId = people[index].id;
      display(selectSearchedNode(d3.select("#" + nodeId)));
      
    });
  }
}
/**
 * displays all filtered nodes in a list as you type
 */
const resultsBox=document.querySelector(".result-box");
function display(result){
  const content = result.map((list) => {
    return "<li onclick=selectInput(this)>" + list + "</li>";
  });

  resultsBox.innerHTML = "<ul>" + content + "</ul>";
}

function selectInput(element) {
  searchBar.value = element.innerHTML;
}

/**
 * returns an array of all nodes with names containing searchTerm
 * @param {string} searchTerm
 */
function getIndiciesOfSearchTerm(searchTerm) {
  let indicies = [];
  let index = -1;
  people.forEach(function (person) {
    //compare against lowercased name
    if (person.name.toLowerCase().includes(searchTerm)) {
      index = people
        .map(function (e) {
          return e.name;
        })
        .indexOf(person.name);
      indicies.push(index);
    }
  });
  return indicies;
}

/**
 * Similar to the selectNode function, this function "selects" nodes by bringing the
 * selected node to the front, magnifying it, and attaching the name.
 * @param {D3 Selection} node
 */
function selectSearchedNode(node) {
  let data = node.data()[0];

  //values from node
  let r = node._groups[0][0].firstChild.r.animVal.value;
  //offset r from x and y to prevent overlap with image
  let x = data["x"];
  let y = data["y"];

  //get parent node
  let parent = d3.select(node.node().parentNode);

  parent.moveToFront();

  let group = node.append("g").attr("class", "searchedText");

  group
    .append("foreignObject")
    .attr("x", x - 30)
    .attr("y", y + (data.Radius / 2) * 4)
    .attr("width", "120px")
    .attr("height", "55px")
    .append("xhtml:div")
    .html(data["FullName"])
    .attr("class", "fullNameNode")
    .attr("class", function () {
      switch (data["Relationship"]) {
        case "friend":
          return "fullNameBorderFriend";
        case "family":
          return "fullNameBorderFamily";
        default:
          return "fullNameBorderBA";
      }
    });
  showSummary(node);
}

/**
 * Removes all elements of the class .searchedText from the view
 */
function clearSearch() {
  d3.selectAll(".searchedText").remove();
  document.getElementById("searchBar").value = "";
  clearDisplay();
}

/**
 * Toggles the absolutely positioned user menu
 */
function toggleMenu() {
  if (USER_MENU_SHOWN) {
    document.getElementById("Toggleable").style.display = "none";
    document.getElementById("ButtonText").innerHTML = "Show Menu";
    document.getElementById("ButtonArrow").style.transform = "rotate(0deg)";
    document.getElementById("UserMenu").style.width = USER_MENU_WIDTH_HIDE;
  } else {
    document.getElementById("UserMenu").style.width = USER_MENU_WIDTH_SHOW;
    document.getElementById("Toggleable").style.display = "block";
    document.getElementById("ButtonText").innerHTML = "Hide Menu";
    document.getElementById("ButtonArrow").style.transform = "rotate(180deg)";
  }
  USER_MENU_SHOWN = !USER_MENU_SHOWN;
}

let svg = d3
  .select("#relationshipWeb")
  .append("svg")
  .attr("width", WIDTH)
  .attr("height", HEIGHT)
  .attr("padding-top", 50);

//define GE as first node (she's not in the big Excel sheet)

let ge = {
    Radius: 10 * 4,
    Closeness: 10 * 4,
    index: 0,
    ImagePath: "image_0",
  };

let links = [];

//list for people datalist
let people = [];

let staticData = [];
let node = [];
let nodes = [];
//create def to group images
let images = svg.append("defs").attr("id", "images");

//set GE's image
setImage("images/png/georgeeliot.png", 0);

//set default image for individuals with no pictures
setImage("images/png/nopicture_friend.png", "friend");
setImage("images/png/nopicture_family.png", "family");

//Scale Legend
let maxRadius = 20;
const scaleLegendGroup = svg
  .append("g")
  .attr("class", "scale-legend")
  .attr("transform", `translate(${(WIDTH * 2) / 5}, 25)`)
  .attr("opacity", 0.7);
const scaleLegend = d3.scaleLinear();

//setup scale Legend
const legendSize = d3
  .legendSize()
  .scale(scaleLegend)
  .shape("circle")
  .title("Size Legend")
  .shapePadding("12")
  .labelOffset(20)
  .orient("horizontal")
  .labels(["Less-Close", "", "", "", "More-Close"])
  .labelWrap(30)
  .shapeWidth(40)
  .labelAlign("start");

// UPDATE DATA VIA API CALL
getMembers().then(result => {
  dynamicData = result;
   
  /**
   * Parse csv datanode
   */
  let parseData = Promise.all([
    d3.csvParse(dynamicData),
    d3.csv("data/staticData.csv"),
  ]).then(function (data) {
    // data[0] contatins ge_people.csv
    // data[1] contains staticData.csv
    staticData = data[1];
    node = data[0];
    node = node.slice(0, 127);

    //parse full name - not used dynamically since
    node.forEach((node) => {
      //node = parseFullName(node); 
    });

    //If name matches, add info to nodes
    for (var i = 0; i < staticData.length; i++){
      var index = node.findIndex(object => {
        return object.FullName === staticData[i].FullName;
      });
      if (index > -1){
        node[index].Links = staticData[i].Links.toString().trim();
        node[index].Closeness = staticData[i].Closeness;
        node[index].Image = staticData[i].Image;
        node[index].Relationship = staticData[i].Relationship;
      }

    }
      node.forEach((node) => {
        //give index to node
        node = setIndex(node);
        node["nodeId"] = "node_" + node["index"];

        // parse closeness into a number
        let closeness = parseInt(node.Closeness);
        if (closeness < 0) {
          node.Closeness = 0;
          node.Radius = 0;
        } else if (isNaN(closeness)){
          node.Closeness = 0;
          node.Radius = 0;
        } 
        else {
          node.Radius = (17 - closeness) * 2;
          node.Closeness = closeness + 2;
        }
        //push current person to list of people for datalist
        let person = new Object();
        person.name = node["FullName"];
        person.id = node["nodeId"];
        people.push(person);

        if (node.Relationship == "friend") {
          node.mainColor = FRIEND_COLOR;
          node.secondaryColor = FRIEND_SECONDARY_COLOR;
        } else if (node.Relationship == "family"){
          node.mainColor = FAMILY_COLOR;
          node.secondaryColor = FAMILY_SECONDARY_COLOR;
        }
        // ** SET ACQUAINTANCE COLOR ** not used
        // else if (node.Relationship == "acquaintance"){
        //   node.mainColor = ACQ_COLOR;
        //   node.secondaryColor = ACQ_SECONDARY_COLOR;
        // }

        if (node.Image) {
          setImage("images/png/" + node.Image, node.index);
          node.ImagePath = "image_" + node.index;
        } else {
          //set individuals with no images to defaults
          switch (node.Relationship) {
            case "friend":
              node.ImagePath = "image_friend";
            
              break;
            case "family":
              node.ImagePath = "image_family";
              
              break;
            default:
              node.ImagePath = "image_friend";
            
              break;
            }
          }
      });
      //NODE FUNCTIONS
      node.unshift(ge);
      node.forEach((node) => {
        nodes.push(node);
        links.push({ source: node.index, target: 0 });
      });

    return nodes;
    });

  parseData.then(function () {
    /**
   * Populates the dropdown for the search functionality and starts a force simulation using nodes data
   */
    //sort and append people data to the datalist
    people.sort(function (a, b) {
      if (a.name > b.name) {
        return 1;
      } else if (b.name > a.name) {
        return -1;
      } else {
        return 0;
      }
    });
    let peopleList = document.getElementById("people");

    people.forEach(function (person) {
      let htmlOption = document.createElement("option");
      htmlOption.value = person.name;
      peopleList.appendChild(htmlOption);
    });

    //create a grouping for nodes
    let nodeGroup = svg.append("g").attr("id", "nodes");
    //append a circle to group
    nodeGroup
      .selectAll("g")
      .data(nodes)
      .enter()
      .append("g")
      .attr("id", function (d) {
        return d["nodeId"];
      });

    let node = nodeGroup
      .selectAll("g")
      .append("circle")
      .attr("class", "RelationshipNode")
      .attr("r", function (d) {
        return d.Radius;
      })
      //fill with image
      .attr("loading", "lazy")
      .attr("fill", function (d) {
        return "url(#" + d.ImagePath + ")";
      })
      .attr("opacity", 0.0)

      //  .attr('onload', function(d){
      //     images.attr('fill', 'url(#' + d.ImagePath + ')')
      //  })

      //add border color
      .attr("stroke", function (d) {
        if (d.mainColor) {
          return d.mainColor;
        } else {
          return GE_COLOR;
        }
      })
      .attr("stroke-width", function (d) {
        return d.Radius / 10;
      })
      .on("mouseover", function () {
        selectNode(d3.select(this));
      })
      .on("mouseout", function () {
        deselectNode(d3.select(this));
      })
      .on("click", function () {
        // console.log(this)
        showSummary(d3.select(this));
      });
    node.transition().duration(500).attr("opacity", 1);
    // .attr('fill', function(d) { return 'url(#' + d.ImagePath + ')'; })

    //scale legend domain
    // scaleLegend.domain(d3.extent(node, function(d) {
    //     console.log(node)
    //     return d.Closeness}))
    //             .range([10, maxRadius])
    scaleLegend.domain([0, 50]).range([10, maxRadius]);

    //setup size legend
    scaleLegendGroup.call(legendSize);
    scaleLegendGroup
      .selectAll("text")
      .attr("fill", "white")
      .attr("stroke-width", 0)
      .style("font-family", "monospace")
      .style("font-size", "14px");
    scaleLegendGroup.select("g").attr("fill", "rgba(231, 220, 67, 0.5)").attr("stroke", "white").attr("stroke-width", 2);

    // console.log(links)
    //set distance between nodes
    let NODE_DISTANCE = 30;
    let linkForce = d3
      .forceLink(links)
      .distance(function (d) {
        return d.source.Closeness * NODE_DISTANCE;
      })
      .id(function (d) {
        return d.index;
      });

    d3.forceSimulation(nodes)
      .force("charge", d3.forceManyBody().strength(5))
      .force("center", d3.forceCenter(WIDTH / 2 + 100, HEIGHT / 2 - 10))
      .alphaDecay(0.085)
      .velocityDecay(0.9)
      .force("x", d3.forceX().strength(0.1))
      .force("y", d3.forceY().strength(0.3))
      .force("links", linkForce)
      .force(
        "collide",
        d3
          .forceCollide()
          .radius((d) => d.Radius + d.Radius / 10)
          .iterations(20)
      )
      .on("tick", function () {
        node
          .attr("cx", function (d) {
            return (d.x = Math.max(d.Radius, Math.min(WIDTH - d.Radius, d.x))); //prevents exiting boundaries
          })
          .attr("cy", function (d) {
            return (d.y = Math.max(d.Radius, Math.min(HEIGHT - d.Radius, d.y))); //prevents exiting boundaries
          });
      });
  });
})
(function(){ 
  document.addEventListener('DOMContentLoaded', function(){

    /** Utility functions **/
    let $ = selector => document.querySelector(selector);  // to select HTML elements

    let tryPromise = fn => Promise.resolve().then(fn);  // to start executing a chain of functions

    let toJson = obj => obj.json();  // Convert json file content to javascript object
	
    /* Control size of display canvas. And resize when browser window change size */	
	let resizeCanvas = () => {    // get current browser window size, and fit canvas size to it
	  let w = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth
      let h = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
      let canvasHeight = '400px'  // minimum height
      let canvasWidth = '600px'   // minimum width
	  let cyHeight = '360px'
	  if  (h > 400) {canvasHeight = h + 'px'; cyHeight = (h-60) + 'px'}
	  if  (w-160 > 600) {canvasWidth = (w-262) + 'px' }
	  $('#canvasWithMenu').style.height = canvasHeight
	  $('#canvasWithMenu').style.width = canvasWidth
	  $('#canvas-menu').style.width = canvasWidth
	  $('#cy').style.height = cyHeight
	  $('#cy').style.width = canvasWidth
	}
	resizeCanvas()   // set initial canvas size
    window.addEventListener("resize", resizeCanvas)   // adjust canvas size when browser window is resized
	
    // Adjust canvas width when entering or exiting fullscreen mode
    let fullscreen_resize = () => { 
	  if (document.fullscreenElement) {   // in fullscreen mode 
	    $('#canvasWithMenu').style.width = '100%'
	    $('#canvas-menu').style.width = '100%'
	    $('#cy').style.width = '100%'
      } else resizeCanvas()   // else if exiting fullscreen mode
	}
    // add event listeners for various web browsers
    document.addEventListener('fullscreenchange', fullscreen_resize)
    document.addEventListener('mozfullscreenchange', fullscreen_resize)  // for firefox
    document.addEventListener('webkitfullscreenchange', fullscreen_resize)  // for Chrome, Safari and Opera
    document.addEventListener('msfullscreenchange', fullscreen_resize)  // for IE, MS Edge


    let cy;  // cytoscape display canvas

    // Close graph popup info box, when user double-clicks on it
    $("#graph-popup1-close").addEventListener('click', function() { $("#graph-popup1").style.display = "none" });
    $("#graph-popup1").addEventListener('dblclick', function() { $("#graph-popup1").style.display = "none" });

    /** Make the popup info box draggable **/
 	
	dragElement(document.getElementById("graph-popup1"), document.getElementById("graph-popup1-pin"));

    // Alternatively, if user erroneously clicks on the pin icon in help msg, click on the correct pin for user
    $('#graph-popup1-pin2').addEventListener('click', function() { $('#graph-popup1-pin').click() })

    function dragElement(elmnt, pinElmnt) {
      var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
      elmnt.onmousedown = dragMouseDown;
      elmnt.ontouchstart = dragMouseDown;  // for touch screens

      // The pin element toggles the draggable function on and off 
      pinElmnt.onclick = toggle;
	  
	  function toggle() {
        $('#graph-popup1-pin').classList.toggle("pin-push") 
		if (elmnt.onmousedown != null) { elmnt.onmousedown = null; elmnt.ontouchstart == null }	  
	    else {
          elmnt.onmousedown = dragMouseDown;
          elmnt.ontouchstart = dragMouseDown;  // for touch screens					
		}  
	  }

      function dragMouseDown(e) {
        e = e || window.event;
        
		if ((e.clientX)&&(e.clientY)) {
          pos3 = e.clientX;
          pos4 = e.clientY;
          document.onmouseup = closeDragElement;
          // call a function whenever the cursor moves:
          document.onmousemove = elementDrag_mouse;

        } else if (e.targetTouches) {
          pos3 = e.targetTouches[0].clientX;
          pos4 = e.targetTouches[0].clientY;
		  document.ontouchend = closeDragElement;
          // call a function whenever the cursor moves:
          document.ontouchmove = elementDrag_touch;
        }
      }

      function elementDrag_mouse(e) {
        e = e || window.event;
        // calculate the new cursor position:
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // set the element's new position:
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
      }

      function elementDrag_touch(e) {
        e = e || window.event;
        // calculate the new cursor position:
        pos1 = pos3 - e.targetTouches[0].clientX;
        pos2 = pos4 - e.targetTouches[0].clientY;
        pos3 = e.targetTouches[0].clientX;
        pos4 = e.targetTouches[0].clientY;
        // set the element's new position:
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
      }

      function closeDragElement() {
        // stop moving when mouse button is released:
        document.onmouseup = null;
        document.onmousemove = null;
		document.ontouchend = null;
        document.ontouchmove = null;
      }
    }

    /** Script for collapsible menu on left panel **/
    let acc = document.getElementsByClassName("accordion")
    for (let i = 0; i < acc.length; i++) {
      acc[i].addEventListener("click", function() {
        // Toggle between adding and removing the "active" class
        this.classList.toggle("active");

        // Toggle between hiding and showing the active panel
        let panel = this.nextElementSibling;
        if (panel.style.maxHeight) {
          panel.style.maxHeight = null;
        } else {
          panel.style.maxHeight = panel.scrollHeight + "px";
        }
      })
    }

  /** Listeners & Actions attached to HTML elements **/
  
  // An Order is selected from dropdown list
  $('#Order').addEventListener('change', function() { 
    const relation_list = ['CONTAINS', 'DELIVERED_TO'];
    if ($('#product_relation').checked){relation_list.push('IS_PRODUCT')}
    if ($('#customer_relation').checked){relation_list.push('PLACED')}
    if ($('#location_relation').checked){relation_list.push('LOCATED_IN')}
    if ($('#bottleneck_relation').checked){relation_list.push('HAS_BOTTLENECK')}
    if ($('#profit_relation').checked){relation_list.push('HIGH_PROFIT')}

    // Display the order node first, in case the next query has null result
    retrieve($('#Order').value, '_', 'order', 'query');  
    retrieve($('#Order').value, relation_list, 'order_relations', 'query');
  });

  // A Product is selected from dropdown list
  $('#Product').addEventListener('change', function() { 
    const relation_list = ['REFERS_TO'];
    if ($('#order_relation').checked){relation_list.push('CONTAINS')}
    if ($('#region_relation').checked){relation_list.push('SOLD_IN')}
    if ($('#customer_relation').checked){relation_list.push('PURCHASED_BY')}

    // Display the product node first, in case the next query has null result
    retrieve($('#Product').value, '_', 'product', 'query');  
    retrieve($('#Product').value, relation_list, 'product_relations', 'query');
  });

  // Retrieve selected order with selected relationships (in checkbox)
  $('#order_checkbox_submit').addEventListener('click', function() { 
    const relation_list = ['CONTAINS', 'DELIVERED_TO'];
    if ($('#product_relation').checked){relation_list.push('IS_PRODUCT')}
    if ($('#customer_relation').checked){relation_list.push('PLACED')}
    if ($('#location_relation').checked){relation_list.push('LOCATED_IN')}
    if ($('#bottleneck_relation').checked){relation_list.push('HAS_BOTTLENECK')}
    if ($('#profit_relation').checked){relation_list.push('HIGH_PROFIT')}
  
    // Display the order node first, in case the next query has null result
    retrieve($('#Order').value, '_', 'order', 'query');  
    retrieve($('#Order').value, relation_list, 'order_relations', 'query');
  });

  // Retrieve selected product with selected relationships (in checkbox)
  $('#product_checkbox_submit').addEventListener('click', function() { 
    const relation_list = ['REFERS_TO'];
    if ($('#order_relation').checked){relation_list.push('CONTAINS')}
    if ($('#region_relation').checked){relation_list.push('SOLD_IN')}
    if ($('#customer_relation').checked){relation_list.push('PURCHASED_BY')}
  
    // Display the product node first, in case the next query has null result
    retrieve($('#Product').value, '_', 'product', 'query');  
    retrieve($('#Product').value, relation_list, 'product_relations', 'query');
  });

  // Special analysis buttons
  $('#critical_regions').addEventListener('click', function() { 
    retrieve('Critical Regions', '_', 'critical_regions', 'query') 
  });

  $('#critical_regions_table').addEventListener('click', function() {
    retrieve2('Critical Regions Table', '_', 'critical_regions_table', 'query2')
    $('#query2').scrollIntoView() 
  });

  $('#triad_analysis').addEventListener('click', function() { 
    retrieve('Supply Chain Triads', '_', 'triad', 'query') 
  });

  $('#triad_table').addEventListener('click', function() {
    retrieve2('Supply Chain Triads Table', '_', 'triad_table', 'query2')
    $('#query2').scrollIntoView() 
  });

  $('#bottlenecks').addEventListener('click', function() { 
    retrieve('Supply Chain Bottlenecks', '_', 'bottlenecks', 'query') 
  });

  $('#high_profit_relationships').addEventListener('click', function() { 
    retrieve('High Profit Relationships', '_', 'high_profit_relationships', 'query') 
  });

  // Entity buttons
  $('#entities_all').addEventListener('click', function() { 
    retrieve('All Entities', '_', 'entities', 'query') 
  });

  $('#entities_customers').addEventListener('click', function() { 
    retrieve('Customers', '_', 'customers', 'query') 
  });

  $('#entities_orders').addEventListener('click', function() { 
    retrieve('Orders', '_', 'orders', 'query') 
  });

  $('#entities_products').addEventListener('click', function() { 
    retrieve('Products', '_', 'products', 'query') 
  });

  // Analysis buttons
  $('#high_profit_by_product_btn').addEventListener('click', function() { 
    const productId = $('#high_profit_product_id').value;
    const profitThreshold = $('#profit_threshold').value || "1000";
    retrieve(`High Profit Analysis - Product ${productId}`, profitThreshold, 'high_profit_by_product/' + productId, 'query') 
  });

  $('#high_profit_by_order_btn').addEventListener('click', function() { 
    const orderId = $('#high_profit_order_id').value;
    const profitThreshold = $('#profit_threshold').value || "1000";
    retrieve(`High Profit Analysis - Order ${orderId}`, profitThreshold, 'high_profit_by_order/' + orderId, 'query') 
  });

  $('#bottlenecks_by_order_btn').addEventListener('click', function() { 
    const orderId = $('#bottlenecks_order_id').value;
    retrieve(`Bottleneck Analysis - Order ${orderId}`, '_', 'bottlenecks_by_order/' + orderId, 'query') 
  });

  $('#regional_sales_by_product_btn').addEventListener('click', function() { 
    const productId = $('#regional_sales_product_id').value;
    retrieve(`Regional Sales Analysis - Product ${productId}`, '_', 'regional_sales_by_product/' + productId, 'query') 
  });

  // Path finding
  $('#button-keywordA').addEventListener('click', function() { 
    searchNode($('#keywordA').value, 'entityA') 
  });
  
  $('#button-keywordB').addEventListener('click', function() { 
    searchNode($('#keywordB').value, 'entityB') 
  });

  $('#button-path').addEventListener('click', function() {
    const entityA = $('#entityA').value;
    const entityB = $('#entityB').value;
    
    // Determine the appropriate path query based on entity types
    let queryType = '';
    if (entityA.startsWith('ORDER') && entityB.startsWith('PROD')) {
      queryType = 'order_product_path';
    } else if (entityA.startsWith('ORDER') && entityB.startsWith('ORDER')) {
      queryType = 'order_order_path';
    } else if (entityA.startsWith('PROD') && entityB.startsWith('PROD')) {
      queryType = 'product_product_path';
    } else {
      alert("Please select compatible entity types (order-product, order-order, or product-product)");
      return;
    }
    
    retrieve(`Path from ${entityA} to ${entityB}`, entityB, queryType + '/' + entityA, 'query');
  });

  /** MAIN FUNCTION **/ 
  // Fetch function submits query to server API (middleware) using GET method, and retrieves json result
  // Display query parameter in element ID 'query'
  // Runs cytoscape visualization
  
  async function retrieve(parameter1, parameter2, queryID, elementID_query) {
    // Display TOPIC (query keyword) as page header
    document.getElementById(elementID_query).innerHTML = parameter1.replace(/_/g, ' ');

    // For testing locally
    API_domain = 'https://starlit-lotus-452809-s4.as.r.appspot.com';
    
    API_router = 'supply-chain';
    
    // If queryID has a slash, extract the path components
    let API_queryID = queryID;
    let API_param1 = encodeURIComponent(parameter1);
    
    // Handle the case where queryID includes the parameter1
    if (queryID.includes('/')) {
      const parts = queryID.split('/');
      API_queryID = parts[0];
      API_param1 = encodeURIComponent(parts[1]);
    }
    
    let API_param2 = encodeURIComponent(parameter2);
    let API_string = `${API_domain}/${API_router}/${API_queryID}/${API_param1}/${API_param2}`;

    fetch(API_string)   // FETCH FROM API
      .then(response => { 
        if (!response.ok) {
          throw new Error("Server API didn't respond");
        }
        return response.json();
      })
      .then(json_value => {   
        // Check whether result is a path or a set of fields (variables)
        // But first check that 1 or more records are retrieved
        if (json_value.length == 0) {	 
          document.getElementById(elementID_query).innerHTML = document.getElementById(elementID_query).innerHTML + 
            '<br/><span style="color: hsl(330, 100%, 50%); text-shadow: none">NO MATCH FOUND</span>';
        } else if (typeof json_value[0]._fields[0].segments !== 'undefined') {	  
          jsonPath2graph(json_value);       // add result Paths to graph
        } else { 
          json2graph(json_value);    // add search results to graph
        }

        if (queryID === 'keyword') { 
          cy.nodes('*').unlock();   // unlock all nodes
          cy.layout(layouts['concentric']).run();
        } else if (queryID === 'order' || queryID === 'product') {  
          // don't unlock nodes
          cy.layout(layouts['cola']).run();    // run default graph layout
        } else {   
          cy.nodes('*').unlock();   // unlock all nodes
          cy.layout(layouts['fcose']).run();   // run fcose for initial layout, then cola for adjustment
          cy.reset();
          cy.layout(layouts['cola']).run();    // run default graph layout
        }
      })
      .catch(error => {
        console.error('Problem with the fetch operation from server API', error);
        document.getElementById(elementID_query).innerHTML = document.getElementById(elementID_query).innerHTML + 
          '<br/><span style="color: hsl(330, 100%, 50%); text-shadow: none">ERROR: ' + error.message + '</span>';
      });
  }

  /** 2nd version of retrieve function to display result in table1 element **/
  async function retrieve2(parameter1, parameter2, queryID, elementID_query) {
    // Display TOPIC (query keyword) as page header
    document.getElementById(elementID_query).innerHTML = 'Result table: ' + parameter1.replace(/_/g, ' ');
    $("#table1").innerHTML = 'Retrieving result ... may take 15 sec. <br/> <br/> <br/> <br/> <br/> <br/>';

    // For testing locally
    API_domain = 'https://starlit-lotus-452809-s4.as.r.appspot.com';
    
    API_router = 'supply-chain';
    API_queryID = queryID;
    API_param1 = encodeURIComponent(parameter1);
    API_param2 = encodeURIComponent(parameter2);
    API_string = `${API_domain}/${API_router}/${API_queryID}/${API_param1}/${API_param2}`;

    fetch(API_string)
      .then(response => { 
        if (!response.ok) {
          throw new Error("Server API didn't respond");
        }
        return response.json();
      })
      .then(json_value => { 
        // Create table display
        let txt = "<table style='border-spacing: 2px;'><tr>";
      
        // Create table header
        for (let y in json_value[0].keys) {  // Process each field in record
          txt += "<th style='background-color:hsl(0,20%,80%)'>" + json_value[0].keys[y] + "</th>";  
        }
        txt += "</tr>";  // close header row
          
        // display records in table rows
        for (let x in json_value) {
          txt += "<tr>";   // open the table row		  
          for (let y in json_value[x]._fields) {  // Process each field in record
            txt += "<td>" + json_value[x]._fields[y] + "</td>";  
          }
          txt += "</tr>";  // close the table row
        }
        txt += "</table>"; 

        // Display table in result element
        $("#table1").innerHTML = txt;
      })
      .catch(error => {
        console.error('Problem with the fetch operation from server API', error);
        $("#table1").innerHTML = '<span style="color: hsl(330, 100%, 50%); text-shadow: none">ERROR: ' + error.message + '</span>';
      });
  }

  /** Carry out keyword search in node labels */
  async function searchNode(keyword, dropdownList) {  // dropdownList is either entityA or entityB
    // For testing locally
    API_domain = 'https://starlit-lotus-452809-s4.as.r.appspot.com';

    API_router = 'supply-chain';
    API_queryID = 'search';
    API_param1 = '_';
    API_param2 = encodeURIComponent(keyword);
    API_string = `${API_domain}/${API_router}/${API_queryID}/${API_param1}/${API_param2}`;

    fetch(API_string)
      .then(response => { 
        if (!response.ok) {
          throw new Error("Server API didn't respond");
        }
        return response.json();
      })
      .then(json_value => { 
        // construct drop-down menu
        let menu_txt = '<option value="">Select</option>';
        for (let x in json_value) {
          const entity = json_value[x]._fields[0].properties;
          let displayId = '';
          
          // Handle different entity types
          if (entity.orderId) {
            displayId = 'ORDER-' + entity.orderId;
          } else if (entity.productId) {
            displayId = 'PROD-' + entity.productId;
          } else if (entity.customerId) {
            displayId = 'CUST-' + entity.customerId;
          } else {
            displayId = entity.id || 'Unknown';
          }
          
          const displayLabel = entity.productName || entity.lastName || entity.city || entity.name || entity.label || displayId;
          menu_txt += `<option value="${displayId}">${displayLabel} (${displayId})</option>`;
        }
        
        // Display drop-down menu
        document.getElementById(dropdownList).innerHTML = menu_txt;
      })
      .catch(error => {
        console.error('Problem with the fetch operation from server API', error);
      });
  }
  
  /** Process a node from Neo4j json result. Create cytoscape node, copy over properties */
  /** Called by json2graph & jsonPath2graph */
  let process_node = node => {
    // Add safety checks
    if (!node || !node.identity) {
      console.error("Invalid node data:", node);
      return; // Skip this node
    }
    
    // Handle different formats of identity
    const nodeId = node.identity.low !== undefined ? node.identity.low : 
                   (typeof node.identity === 'number' ? node.identity : String(node.identity));
    
    // Create cytoscape node with safer property access
    cy.add({ data: {
      id: nodeId,
      id2: node.properties ? (
        node.properties.orderId || 
        node.properties.productId || 
        node.properties.customerId || 
        node.properties.id || 
        "unknown-" + nodeId
      ) : "unknown-" + nodeId,
      supertype: node.labels && node.labels.length > 0 ? node.labels[0] : "Unknown",
      type: node.properties && node.properties.type ? node.properties.type : 
            (node.labels && node.labels.length > 0 ? node.labels[0] : "Unknown"),
      label: node.properties ? (
        node.properties.productName || 
        node.properties.lastName || 
        node.properties.orderId || 
        node.properties.city || 
        node.properties.name || 
        node.properties.label || 
        "Node " + nodeId
      ) : "Node " + nodeId,
    }});

    // Add node type to nodeTypeRegistry array if not already exists
    if (!nodeTypeRegistry.includes(node.labels[0])) {
      nodeTypeRegistry.push(node.labels[0]);
    }

    const cy_ele = cy.$id(node.identity.low);  // retrieve newly created node to add more fields

    // add other fields
    for (let z in node.properties) { 
      const z_obj = node.properties[z];
      switch (z) {          // handle dates & URLs
        case 'orderId': 
        case 'productId': 
        case 'customerId': 
        case 'id': 
        case 'type': 
        case 'label':
        case 'productName':
        case 'lastName':
        case 'city':
        case 'name':
          break;   // skip fields already displayed
        case 'orderDate': 
        case 'shippedDate': 
        case 'requiredDate': 
          if (z_obj.year && z_obj.month && z_obj.day) {
            cy_ele.data(z, z_obj.year.low + '-' + z_obj.month.low + '-' + z_obj.day.low);
          }
          break;
          case 'delayRisk':
          case 'geographicRisk':
          case 'marketRisk':
          case 'profit':
              // Check if z_obj is a number before calling toFixed
              if (typeof z_obj === 'number' && !isNaN(z_obj)) {
                cy_ele.data(z, z_obj.toFixed(2));
              } else {
                cy_ele.data(z, z_obj); // Use original value if not a number
              }
              break;
        default: 
          cy_ele.data(z, JSON.stringify(z_obj).slice(1,-1));
      }		  
    }
  };

  /** Process a relation from Neo4j json result, create cytoscape edge, transfer properties */
  let process_relation = relation => {
    // Get last segment of elementId -- to use as relation ID no.
    let relationID = relation.elementId.split(':')[2];

    // Check whether relation exists in the graph
    if (cy.$id(relationID).length == 0) {
      // Add edge to graph if not already exists
      cy.add({ data: {
        id: relationID,
        source: relation.start.low,
        target: relation.end.low,
        supertype: relation.type,
        type: relation.properties.type || relation.type,
      }});
    }

    // Add relation type to edgeTypeRegistry array if not already exists
    if (!edgeTypeRegistry.includes(relation.type)) {
      edgeTypeRegistry.push(relation.type);
    }

    const cy_ele = cy.$id(relationID);

    // add other fields
    for (let z in relation.properties) { 
      const z_obj = relation.properties[z];
      switch (z) {          // handle dates & URLs
        case 'id': 
        case 'type': 
          break;   // skip fields already displayed
        case 'date': 
          if (z_obj.year && z_obj.month && z_obj.day) {
            cy_ele.data(z, z_obj.year.low + '-' + z_obj.month.low + '-' + z_obj.day.low);
          }
          break;
          case 'profit':
          case 'quantity':
          case 'purchaseCount':
              // Check if z_obj is a number before calling toFixed
              if (typeof z_obj === 'number' && !isNaN(z_obj)) {
                cy_ele.data(z, z_obj.toFixed(2));
              } else {
                cy_ele.data(z, z_obj); // Use original value if not a number
              }
              break;
        default: 
          cy_ele.data(z, JSON.stringify(z_obj).slice(1,-1));
      }
    }
  };

  /** Add Neo4j result records to Cytoscape graph */
  let json2graph = records => {
    // restore nodes and edges previously removed from graph
    if (!node_edge_removed.empty()) node_edge_removed.restore();
		
    for (let x in records) {  // Process each record
      /* Process all the node fields first */
      for (let y in records[x]._fields) {  // Process each field in record
        // check whether field represents a null (blank), a relation or a node
        if (records[x]._fields[y] === null) {   // field is blank (null) 
        } else if (typeof records[x]._fields[y].type !== 'undefined') {
          // the field represents a RELATION - skip for now
        } else { 
          // field is a NODE, not relation. Create cytoscape node
          process_node(records[x]._fields[y]);  
        }
      }
	  
      /* Now process all the relations */
      for (let y in records[x]._fields) {  // Process each field in record
        // check whether field represents a null (blank), a relation or a node
        if (records[x]._fields[y] === null) {   // field is blank (null) 
        } else if (typeof records[x]._fields[y].type !== 'undefined') {
          // field represents a RELATION
          process_relation(records[x]._fields[y]);		  
        }
      }
    }
    toolboxFilter_createCheckboxes(nodeTypeRegistry, edgeTypeRegistry);
    console.log('num nodes:', cy.nodes().length);
    console.log('num edges:', cy.edges().length);
    if (cy.nodes().length > 50) {    // if big graph, open sidepanel and suggest applying filter
      $('#panel-filter-help').innerHTML = `<br/>Graph has ${cy.nodes().length} nodes. Consider applying a filter`;
      $('#panel-filter-help').style.visibility = 'visible';
      $('#sidepanel1').classList.add("sidepanel-pin", "transition-delay");  // open sidepanel
    } else {
      $('#panel-filter-help').innerHTML = '';
      $('#panel-filter-help').style.visibility = 'hidden';
      $('#sidepanel1').classList.remove("sidepanel-pin", "transition-delay");  // close sidepanel
    }
  };
  
  /** For Neo4j result in the form of paths */
  /** Add Neo4j result records to Cytoscape graph */
  let jsonPath2graph = records => {
    // restore nodes and edges previously removed from graph
    if (!node_edge_removed.empty()) node_edge_removed.restore();
		
    for (let x in records) {  // Process each record
      /* Process all the node fields first in each path-segment */
      for (let y in records[x]._fields[0].segments) {  // Assume there's only 1 field, usually p (for path).
        // Process start node and end node in segment
        process_node(records[x]._fields[0].segments[y].start);
        process_node(records[x]._fields[0].segments[y].end);
		
        // Process relation
        process_relation(records[x]._fields[0].segments[y].relationship);
      }
    }
    toolboxFilter_createCheckboxes(nodeTypeRegistry, edgeTypeRegistry);
    console.log('num nodes:', cy.nodes().length);
    if (cy.nodes().length > 50) {    // if big graph, open sidepanel and suggest applying filter
      $('#panel-filter-help').innerHTML = `<br/>Graph has ${cy.nodes().length} nodes. Consider applying a filter`;
      $('#panel-filter-help').style.visibility = 'visible';
      $('#sidepanel1').classList.add("sidepanel-pin", "transition-delay");  // open sidepanel
    } else {
      $('#panel-filter-help').innerHTML = '';
      $('#panel-filter-help').style.visibility = 'hidden';
      $('#sidepanel1').classList.remove("sidepanel-pin", "transition-delay");  // close sidepanel
    }
  };
 
  cy = cytoscape({   // Create cytoscape object
    container: $('#cy'),
    minZoom: 0.5,
    maxZoom: 4,
	
    elements: [], // list of graph elements to start with

    style: [ // the stylesheet for the graph
      {
        selector: "node",
        style: {
          "label": "data(label)",
          "text-wrap": "wrap",
          "text-max-width": "180px",
          "background-color": "hsl(210,80%,90%)",
          "border-width": 0.0,
          "height": 30.0,
          "shape": "ellipse",
          "font-size": 12,
          "color": "hsl(210,80%,20%)",
          "text-opacity": 1.0,
          "text-valign": "center",
          "text-halign": "center",
          "font-family": "Tahoma, Arial, sans-serif",
          "font-weight": "normal",
          "border-opacity": 0.0,
          "border-color": "hsl(0,0%,100%)",
          "width": 50.0,
          "background-opacity": 1.0,
          "content": "data(label)"
      }}, 
      {
        selector: "edge",
        style: {
          "label": "data(label)",
          "text-wrap": "wrap",
          "text-max-width": "200px",
          "line-style": "solid",
          "curve-style": "bezier",
          "font-size": 12,
          "color": "hsl(210,80%,20%)",
          "line-color": "hsl(210,80%,70%)",
          "text-opacity": 1.0,
          "width": 1.0,
          "font-family": "Tahoma, Arial, sans-serif",
          "font-weight": "normal",
          "opacity": 1.0,
          "source-arrow-color": "hsl(0,0%,100%)",
          "source-arrow-shape": "none",
          "target-arrow-shape": "vee",
          "target-arrow-color": "hsl(210, 55%, 65%)",
          "target-arrow-fill": "hollow",
          "arrow-scale": 1,
          "content": "data(type)"
      }},
      {
        selector: "node[supertype = 'Order']",
        style: {
          "background-color": "hsl(120, 80%, 90%)",
          "shape": "round-rectangle",
          "height": 20.0,
          "border-width": 1.0,
          "border-opacity": 1.0,
          "border-color": "hsl(120, 80%, 50%)",
          "width": 80.0,
          "background-opacity": 1.0,
      }},
      {
        selector: "node[supertype = 'Product']",
        style: {
          "background-color": "hsl(200, 80%, 90%)",
          "border-width": 1.0,
          "height": 20.0,
          "shape": "diamond",
          "border-opacity": 1.0,
          "border-color": "hsl(200, 50%, 50%)",
          "width": 20.0,
          "background-opacity": 1.0,
      }},
      {
        selector: "node[supertype = 'Customer']",
        style: {
          "background-color": "hsl(30, 80%, 90%)",
          "shape": "round-rectangle",
          "height": 20.0,
          "border-width": 1.0,
          "border-opacity": 1.0,
          "border-color": "hsl(30, 60%, 70%)",
          "width": 80.0,
          "background-opacity": 1.0,
      }},
      {
        selector: "node[supertype = 'GeographicArea']",
        style: {
          "background-color": "hsl(270, 80%, 90%)",
          "shape": "hexagon",
          "height": 25.0,
          "border-width": 1.0,
          "border-opacity": 1.0,
          "border-color": "hsl(270, 60%, 70%)",
          "width": 25.0,
          "background-opacity": 1.0,
      }},
      {
        selector: "node[supertype = 'Bottleneck']",
        style: {
          "background-color": "hsl(0, 80%, 90%)",
          "shape": "octagon",
          "height": 25.0,
          "border-width": 1.0,
          "border-opacity": 1.0,
          "border-color": "hsl(0, 80%, 50%)",
          "width": 25.0,
          "background-opacity": 1.0,
      }},
      {
        selector: "edge[supertype = 'CONTAINS']",
        style: {
          "line-color": "hsl(120, 100%, 40%)",
          "width": 2.0,
      }},
      {
        selector: "edge[supertype = 'DELIVERED_TO']",
        style: {
          "line-color": "hsl(270, 100%, 40%)",
          "width": 2.0,
      }},
      {
        selector: "edge[supertype = 'HIGH_PROFIT']",
        style: {
          "line-color": "hsl(45, 100%, 50%)",
          "width": 3.0,
      }},
      {
        selector: "edge[supertype = 'HAS_BOTTLENECK']",
        style: {
          "line-color": "hsl(0, 100%, 50%)",
          "width": 2.5,
      }}, 
      {
        selector: "node:selected",
        style: {
          "background-color": "hsl(280,100%,70%)"
      }}, 
      {
        selector: "edge:selected",
        style: {
          "line-color": "hsl(280,100%,30%)",
      }},
    ],
  });

  let layouts = {
    cola: {
        name: 'cola',
		
        animate: true, // whether to show the layout as it's running
        refresh: 1, // number of ticks per frame; higher is faster but more jerky
        maxSimulationTime: 20000, // max length in ms to run the layout
        ungrabifyWhileSimulating: false, // so you can't drag nodes during layout
        fit: false, // on every layout reposition of nodes, fit the viewport
        padding: 30, // padding around the simulation
        boundingBox: undefined, // constrain layout bounds; { x1, y1, x2, y2 } or { x1, y1, w, h }
        nodeDimensionsIncludeLabels: false, // whether labels should be included in determining the space used by a node

        // layout event callbacks
        ready: function(){}, // on layoutready
        stop: function(){}, // on layoutstop

        // positioning options
        randomize: false, // use random node positions at beginning of layout
        avoidOverlap: true, // if true, prevents overlap of node bounding boxes
        handleDisconnected: true, // if true, avoids disconnected components from overlapping
        convergenceThreshold: 0.01, // when the alpha value (system energy) falls below this value, the layout stops
        nodeSpacing: function(node){ return 20; }, // extra spacing around nodes
        flow: undefined, // use DAG/tree flow layout if specified, e.g. { axis: 'y', minSeparation: 30 }
        alignment: undefined, // relative alignment constraints on nodes
        gapInequalities: undefined, // list of inequality constraints for the gap between the nodes
        centerGraph: true, // adjusts the node positions initially to center the graph

        // different methods of specifying edge length
        // each can be a constant numerical value or a function like `function(edge){ return 2; }`
        edgeLength: 150, // sets edge length directly in simulation
        edgeSymDiffLength: undefined, // symmetric diff edge length in simulation
        edgeJaccardLength: undefined, // jaccard edge length in simulation

        // iterations of cola algorithm; uses default values on undefined
        unconstrIter: undefined, // unconstrained initial layout iterations
        userConstIter: undefined, // initial layout iterations with user-specified constraints
        allConstIter: undefined, // initial layout iterations with all constraints including non-overlap
    },
    breadthfirst: {  	
      name: 'breadthfirst',
      fit: false, // whether to fit the viewport to the graph
      directed: true, // whether the tree is directed downwards (or edges can point in any direction if false)
      padding: 30, // padding on fit
      circle: false, // put depths in concentric circles if true, put depths top down if false
      grid: false, // whether to create an even grid into which the DAG is placed (circle:false only)
      spacingFactor: 1.5, // positive spacing factor, larger => more space between nodes
      boundingBox: undefined, // constrain layout bounds; { x1, y1, x2, y2 } or { x1, y1, w, h }
      avoidOverlap: true, // prevents node overlap, may overflow boundingBox if not enough space
      nodeDimensionsIncludeLabels: false, // Excludes the label when calculating node bounding boxes
      roots: undefined, // the roots of the trees
      maximal: false, // whether to shift nodes down their natural BFS depths
      animate: false, // whether to transition the node positions
      animationDuration: 500, // duration of animation in ms if enabled
      animationEasing: undefined, // easing of animation if enabled
      animateFilter: function(node, i){ return true; }, // a function that determines whether the node should be animated
      ready: undefined, // callback on layoutready
      stop: undefined, // callback on layoutstop
      transform: function(node, position){ return position; } // transform a given node position
    },
    fcose: {
      name: 'fcose',
      quality: "default", // "draft", "default", or "proof" 
      randomize: true, // Use random node positions at beginning of layout
      animate: false, // Whether or not to animate the layout
      animationDuration: 1000, // Duration of animation in ms, if enabled
      animationEasing: undefined, // Easing of animation, if enabled
      fit: true, // Fit the viewport to the repositioned nodes
      padding: 30, // Padding around layout
      nodeDimensionsIncludeLabels: false, // Whether to include labels in node dimensions
      uniformNodeDimensions: false, // Whether or not simple nodes are of uniform dimensions
      packComponents: true, // Whether to pack disconnected components
      step: "all", // Layout step - all, transformed, enforced, cose - for debug purpose only
      samplingType: true, // False for random, true for greedy sampling
      sampleSize: 25, // Sample size to construct distance matrix
      nodeSeparation: 75, // Separation amount between nodes
      piTol: 0.0000001, // Power iteration tolerance
      nodeRepulsion: node => 15000, // Node repulsion (non overlapping) multiplier
      idealEdgeLength: edge => 100, // Ideal edge (non nested) length
      edgeElasticity: edge => 0.45, // Divisor to compute edge forces
      nestingFactor: 0.1, // Nesting factor (multiplier) to compute ideal edge length for nested edges
      numIter: 2500, // Maximum number of iterations to perform
      tile: true, // For enabling tiling
      tilingPaddingVertical: 10, // Vertical padding for tiling
      tilingPaddingHorizontal: 10, // Horizontal padding for tiling
      gravity: 0.25, // Gravity force (constant)
      gravityRangeCompound: 1.5, // Gravity range (constant) for compounds
      gravityCompound: 1.0, // Gravity force (constant) for compounds
      gravityRange: 3.8, // Gravity range (constant)
      initialEnergyOnIncremental: 0.3, // Initial cooling factor for incremental layout
      fixedNodeConstraint: undefined, // Fix desired nodes to predefined positions
      alignmentConstraint: undefined, // Align desired nodes in vertical/horizontal direction
      relativePlacementConstraint: undefined, // Place two nodes relatively in vertical/horizontal direction
      ready: () => {}, // on layoutready
      stop: () => {} // on layoutstop
    },
    concentric: {
      name: 'concentric',
      fit: false, // whether to fit the viewport to the graph
      padding: 30, // the padding on fit
      startAngle: 3 / 2 * Math.PI, // where nodes start in radians
      sweep: undefined, // how many radians should be between the first and last node
      clockwise: true, // whether the layout should go clockwise
      equidistant: false, // whether levels have an equal radial distance betwen them
      minNodeSpacing: 10, // min spacing between outside of nodes
      boundingBox: undefined, // constrain layout bounds
      avoidOverlap: true, // prevents node overlap, may overflow boundingBox if not enough space
      nodeDimensionsIncludeLabels: false, // Excludes the label when calculating node bounding boxes
      height: undefined, // height of layout area (overrides container height)
      width: undefined, // width of layout area (overrides container width)
      spacingFactor: undefined, // Applies a multiplicative factor to expand or compress the overall area that the nodes take up
      concentric: function(node){ // returns numeric value for each node, placing higher nodes in levels towards the centre
        return node.degree();
      },
      levelWidth: function(nodes){ // the variation of concentric values in each level
        return nodes.maxDegree() / 4;
      },
      animate: false, // whether to transition the node positions
      animationDuration: 500, // duration of animation in ms if enabled
      animationEasing: undefined, // easing of animation if enabled
      animateFilter: function(node, i){ return true; }, // a function that determines whether the node should be animated
      ready: undefined, // callback on layoutready
      stop: undefined, // callback on layoutstop
      transform: function(node, position){ return position; } // transform a given node position
    },
    spread: {
      name: 'spread',
      animate: true, // Whether to show the layout as it's running
      ready: undefined, // Callback on layoutready
      stop: undefined, // Callback on layoutstop
      fit: true, // Reset viewport to fit default simulationBounds
      minDist: 20, // Minimum distance between nodes
      padding: 20, // Padding
      expandingFactor: -1.0, // If the network does not satisfy the minDist criterium then it expands the network of this amount
      prelayout: { name: 'fcose' }, // Layout options for the first phase
      maxExpandIterations: 4, // Maximum number of expanding iterations
      boundingBox: undefined, // Constrain layout bounds; { x1, y1, x2, y2 } or { x1, y1, w, h }
      randomize: false // Uses random initial node positions on true
    },
  };

  /** Listeners & Actions attached to Cytoscape display & elements **/
  
  /* Change graph layout */
  $('#layout-breadthfirst').addEventListener('click', function(){ cy.nodes('*').unlock(); cy.layout(layouts['breadthfirst']).run() });
  $('#layout-fcose').addEventListener('click', function(){ cy.nodes('*').unlock(); cy.layout(layouts['fcose']).run() });
  $('#layout-concentric').addEventListener('click', function(){ cy.nodes('*').unlock(); cy.layout(layouts['concentric']).run() });
  $('#layout-cola').addEventListener('click', function(){ cy.nodes('*').unlock(); cy.layout(layouts['cola']).run() });
  $('#clear_canvas').addEventListener('click', function(){ 
     cy.elements().remove();  // clear the graph
     nodeTypeRegistry = [];    // for storing all the node types 
     edgeTypeRegistry = [];   // for storing all the edge types
     node_edge_removed = cy.collection();  // for storing nodes and edges removed from the graph
     $('#panel-filter-help').innerHTML = 
        `<br/><span style='color: hsl(336, 100%, 30%)'>First, display a graph on the canvas by clicking on buttons on the left panel.<br/>
	    Then a list of node types will display here for selection.</span><br/> <br/>`;
     $('#panel-filter-help').style.visibility = 'visible';
     $('#sidepanel1').classList.remove("sidepanel-pin", "sidepanel-pin2", "transition-delay");  // close sidepanel
     $('#sidepanel-pin2').classList.remove("pin-push");  // reset pin button sidepanel	 
     $('#checkboxes-nodeTypes').innerHTML = ''; // remove checkboxes
     $('#checkboxes-edgeTypes').innerHTML = '';
     $('#checkbox_submit1').style.visibility = 'hidden';
     $('#checkbox_submit2').style.visibility = 'hidden';
     $('#checkbox_clear1').style.visibility = 'hidden'; 
     $('#checkbox_clear2').style.visibility = 'hidden';
     $('#checkbox_reset1').style.visibility = 'hidden';
     $('#checkbox_reset2').style.visibility = 'hidden';
   });
  $('#zoom-reset').addEventListener('click', function(){ cy.reset(); });
  $('#zoom-plus').addEventListener('click', function(){ cy.zoom(cy.zoom()+0.1) });
  $('#zoom-minus').addEventListener('click', function(){ cy.zoom(cy.zoom()-0.1) });
  $('#layout-spread').addEventListener('click', function(){ cy.nodes('*').unlock(); cy.layout(layouts['spread']).run() });
  $('#fullscreen').addEventListener('click', function(){ openFullscreen(); cy.reset(); });

  function openFullscreen() {
    if ($('#canvasWithMenu').requestFullscreen) {
      $('#canvasWithMenu').requestFullscreen();
    } else if ($('#canvasWithMenu').webkitRequestFullscreen) { /* Safari */
      $('#canvasWithMenu').webkitRequestFullscreen();
    } else if ($('#canvasWithMenu').msRequestFullscreen) { /* IE11 */
      $('#canvasWithMenu').msRequestFullscreen();
    }
  }

  let cy_addListener = cy => {    // Create function to attach actions to clicks on graph nodes and edges
    /* Respond to clicks on graph nodes & edges */
    cy.on('tap', 'node', function(event){
      let node = event.target;      // event.target represents the element that was clicked

      // If node is a Parent (Cluster) node, then exit function
      if (node.data()['type'] == 'Cluster') return;

      // html text to display in panel. Start with ID2 field
      let txt = '<p><b>ID: ' + node.data()['id2'] + '</b></p>';  
      txt = txt.replace(/_/g, ' ');   // replace _ with space

      // Display the node type
      txt += '<p><b>Type: ' + node.data()['supertype'] + '</b></p>';

        
      // Display all other properties
      for (let x in node.data()) {
        switch (x) {          
          case 'id': case 'id2': case 'supertype': case 'type': case 'label': 
          case 'profit': case 'delayRisk': case 'geographicRisk': case 'marketRisk': 
            break;   // skip fields already displayed
          case 'orderDate': case 'shippedDate': case 'requiredDate':
            txt += '<p><em>' + x + '</em>: ' + node.data()[x] + '</p>';
            break;
          default: 
            if (node.data()[x] !== '') { 
              txt += '<p><em>' + x + '</em>: ' + node.data()[x] + '</p>';
            }
        }
      }
      
      $('#node-expand').value = node.data()['id2'];  // Add node ID2 to button value
      $('#node-remove').value = node.data()['id'];   // Add cytoscape node ID to button value
      $('#graph-popup1-content').innerHTML = txt;
      $('#graph-popup1').style.display = 'block'; 
      $('#graph-popup1-menu').style.display = 'block'; 
    });

    cy.on('tap', 'edge', function(event){
      let edge = event.target;
      let txt = '<p><b>Relation: ' + edge.data()['supertype'] + '</b></p>';  // html text to display in panel
      
      // Display all other properties
      for (let x in edge.data()) {
        switch (x) {          
          case 'id': case 'source': case 'target': case 'supertype': case 'type': case 'profit':
            break;   // skip fields already displayed
          default: 
            if (edge.data()[x] !== '') { 
              txt += '<p><em>' + x + '</em>: ' + edge.data()[x] + '</p>';
            }
        }
      }
      
      $('#graph-popup1-content').innerHTML = txt;
      $('#graph-popup1').style.display = 'block'; 
      $('#graph-popup1-menu').style.display = 'none'; 
    });

    /* Expand a node with neighboring nodes, when user rightclicks on a node */
    cy.on('cxttap', 'node', function(event){
      let node = event.target;      // event.target represents the element that was clicked
      node.select();
      
      // If node is a Parent (Cluster) node, then exit function
      if (node.data()['type'] == 'Cluster') return;

      cy.nodes('*').unlock();   // unlock all nodes
      node.lock();              // lock selected node

      // Determine appropriate API endpoint based on node type
      let queryType = '';
      if (node.data()['supertype'] === 'Order') {
        queryType = 'order_neighbors';
      } else if (node.data()['supertype'] === 'Product') {
        queryType = 'product_neighbors';
      } else {
        // Default behavior for other node types
        queryType = 'entity_neighbors';
      }
      
      retrieve(node.data()['id2'], '_', queryType, 'query');
    });

    /* Double-click -- same as right-click */
    cy.on('dbltap', 'node', function(event){
      let node = event.target;      // event.target represents the element that was clicked
      node.select();

      // If node is a Parent (Cluster) node, then exit function
      if (node.data()['type'] == 'Cluster') return;

      cy.nodes('*').unlock();   // unlock all nodes
      node.lock();              // lock selected node

      // Determine appropriate API endpoint based on node type
      let queryType = '';
      if (node.data()['supertype'] === 'Order') {
        queryType = 'order_neighbors';
      } else if (node.data()['supertype'] === 'Product') {
        queryType = 'product_neighbors';
      } else {
        // Default behavior for other node types
        queryType = 'entity_neighbors';
      }
      
      retrieve(node.data()['id2'], '_', queryType, 'query');
    });

    /* On mousedown, unlock() the node */
    cy.on('tapstart', 'node', function(event){
      let node = event.target;      // event.target represents the element that was clicked
      node.unlock();              // unlock selected node
    });
  };

  cy_addListener(cy);   // Run function on current cytoscape graph
 
  /* Add listeners for expanding and removing existing Cytoscape nodes */
  // expand node id stored in button value
  $('#node-expand').addEventListener('click', function() { 
    cy.nodes('*').unlock();   // unlock all nodes
    cy.$id($('#node-expand').name).lock();  // lock selected node	
    
    // Determine appropriate API endpoint based on node ID format
    let queryType = '';
    const nodeId = $('#node-expand').value;
    
    if (nodeId.startsWith('ORDER-')) {
      queryType = 'order_neighbors';
    } else if (nodeId.startsWith('PROD-')) {
      queryType = 'product_neighbors';
    } else {
      // Default behavior for other node types
      queryType = 'entity_neighbors';
    }
    
    retrieve(nodeId, '_', queryType, 'query');
  });
  
  // remove node stored in button value
  $('#node-remove').addEventListener('click', function() { 
    cy.$id($('#node-remove').value).remove();  // remove the node from the graph
  });  

  /*** Code for Side Panel & Toolbox functions ***/

  // global variables
  let nodeTypeRegistry = [];    // for storing all the node types -- to display in toolbox
  let edgeTypeRegistry = [];   // for storing all the edge types
  let node_edge_removed = cy.collection();  // for storing nodes and edges removed from the graph
  acc[6].click();  // in the sidepanel, start with the first accordion panel open
  
  // pin2 icon is clicked by user
  $("#sidepanel-pin2").addEventListener('click', function() { 
    $('#sidepanel1').classList.toggle("sidepanel-pin2");
    $('#sidepanel-pin2').classList.toggle("pin-push");
  });

  // Remove pin (but not pin2) when mouseover the panel
  $("#sidepanel1").addEventListener('mouseenter', function() { 
    $('#sidepanel1').classList.remove("sidepanel-pin", "transition-delay");
  });

  // Add transition delay (i.e. delay closing the panel) when mouseleave (alternatively mouseout)
  $("#sidepanel1").addEventListener('mouseleave', function() { 
    $('#sidepanel1').classList.add("transition-delay");
  });

  /* Code for the Toolbox Filter -- to display textboxes in sidepanel */
  let toolboxFilter_createCheckboxes = (nodeTypes, edgeTypes) => {
    // Create checkboxes for nodeTypes
    let txt = '<br/><b>Select node types to retain in graph:</b><br/>';  // initialize txt variable

    nodeTypes.sort();
    txt += nodeTypes.map(item => {
      return `<input type="checkbox" value="${item}" class="checkNode" checked>${item}<br>`;
    }).join('');   // The join method is used to specify a different separator 

    // Display checkboxes
    document.getElementById('checkboxes-nodeTypes').innerHTML = txt;

    // Create checkboxes for edgeTypes
    txt = '<b>Select relation types to retain:</b><br/>';  // initialize txt variable
    edgeTypes.sort();
    txt += edgeTypes.map(item => {
      return `<input type="checkbox" value="${item}" class="checkEdge" checked>${item}<br>`;
    }).join('');   

    document.getElementById('checkboxes-edgeTypes').innerHTML = txt;  // Display checkboxes
    $('#checkbox_submit1').style.visibility = 'visible';    // make submit buttons visible
    $('#checkbox_submit2').style.visibility = 'visible';    // make submit buttons visible
    $('#checkbox_clear1').style.visibility = 'visible';   
    $('#checkbox_clear2').style.visibility = 'visible';   
    $('#checkbox_reset1').style.visibility = 'visible';   
    $('#checkbox_reset2').style.visibility = 'visible';    
    acc[6].click();  // close accordion filter panel
    acc[6].click();  // re-open accordion panel
  };

  /* Process submit button1 and submit button2 */
  // Both buttons do the same thing -- apply node filter and edge filter
  let apply_filter = () => {
    // restore nodes and edges previously removed
    if (!node_edge_removed.empty()) node_edge_removed.restore();

    let node_edge_collection = cy.collection();  // collection of nodes and edges to remove
    let checkedList = [];  // for collecting the checked boxes (nodes or edges)
    let checkedListValue = [];   // to store an array of checked values extracted from checkedList

    // identify checked boxes for edge types 
    checkedList = document.querySelectorAll('.checkEdge:checked');  // collect the checked boxes for edges
    for (let i = 0; i < checkedList.length; i++) {
      checkedListValue.push(checkedList[i].value);  // extract the values from the nodes
    }
    let uncheckedEdgeTypes = []; // array of unchecked edge type values
    
    // Compare edgeTypeRegistry array with checkedListValue array to identify unchecked edge types
    edgeTypeRegistry.forEach(item => {
      if (!checkedListValue.includes(item) && !uncheckedEdgeTypes.includes(item)) { 
        uncheckedEdgeTypes.push(item);
      }
    });

    // Identify edges in graph that match the unchecked values, and remove them
    let selector = '';   // var for constructing cytoscape selector
    for (let i = 0; i < uncheckedEdgeTypes.length; i++) {
      selector = `edge[supertype = "${uncheckedEdgeTypes[i]}"]`;
      node_edge_collection = node_edge_collection.union(selector);
    }

    /* Apply node filter */
    // identify checked boxes for node types 
    checkedList = document.querySelectorAll('.checkNode:checked');  // collect the checked boxes (nodes)
    checkedListValue = [];   // to store an array of checked values extracted from checkedList
    for (let i = 0; i < checkedList.length; i++) {
      checkedListValue.push(checkedList[i].value);  // extract the values from the nodes
    }
    let uncheckedNodeTypes = [];  // array of unchecked node type values
        
    // Compare nodeTypeRegistry with checkedListValue array to identify unchecked values
    nodeTypeRegistry.forEach(item => {
      if (!checkedListValue.includes(item) && !uncheckedNodeTypes.includes(item)) { 
        uncheckedNodeTypes.push(item);
      }
    });

    // Select nodes in graph that match the unchecked types, and remove them
    for (let i = 0; i < uncheckedNodeTypes.length; i++) {    // run through the array
      selector = `node[supertype = "${uncheckedNodeTypes[i]}"]`;   // select nodes matching each type
      node_edge_collection = node_edge_collection.union(selector);        // collect nodes into a collection
    }
    node_edge_removed = cy.remove(node_edge_collection);             // remove nodes from graph, and store temporarily
  };

  // apply filter
  $('#checkbox_submit1').addEventListener('click', apply_filter);    
  $('#checkbox_submit2').addEventListener('click', apply_filter);  

  // uncheck all the boxes 
  $('#checkbox_clear1').addEventListener('click', function(){   
    document.querySelectorAll('.checkNode').forEach(function(checkbox){checkbox.checked=false});
  });    
  $('#checkbox_clear2').addEventListener('click', function(){
    document.querySelectorAll('.checkEdge').forEach(function(checkbox){checkbox.checked=false});
  });   
  // check all the boxes
  $('#checkbox_reset1').addEventListener('click', function(){   
     document.querySelectorAll('.checkNode').forEach(function(checkbox){checkbox.checked=true}) })   
  $('#checkbox_reset2').addEventListener('click', function(){
     document.querySelectorAll('.checkEdge').forEach(function(checkbox){checkbox.checked=true}) })   

 
  });

})();

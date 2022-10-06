/**
 * @fileoverview This file adds all necesary callback functions of events a vis.js network
 * @package Requires vis network package.
 * @package Requires react package for the dispatch type.
 * @author Marco Expósito Pérez
 */
//Constants
import { CommunityData, UserData } from "../constants/perspectivesTypes";
import { nodeConst } from "../constants/nodes";
import { SelectedObjectAction, SelectedObjectActionEnum, StateFunctions } from "../constants/auxTypes";
//Packages
import { BoundingBox, DataSetEdges, DataSetNodes, FitOptions, IdType, Network, TimelineAnimationType } from "vis-network";
import { Dispatch } from "react";
//Local files
import { getHTMLPosition } from "../basicComponents/Tooltip";
import NetworkController from "./networkController";
import BoxesController from "./boundingBoxes";
import NodeVisuals from "./nodeVisuals";
import EdgeVisuals from "./edgeVisuals";

export default class EventsController {

    //Bounding boxes controller
    bbController: BoxesController;
    //Node visuals controller
    nodeVisuals: NodeVisuals;
    //Edge visuals controller
    edgeVisuals: EdgeVisuals;

    //Reference to the network canvas
    refHTML: HTMLDivElement;

    //Vis.js network object
    net: Network;
    //Nodes of the network
    nodes: DataSetNodes;
    //Edges of the network
    edges: DataSetEdges;

    //Current tooltip data before being parsed
    tooltipData?: UserData | CommunityData;
    //ID of the current focused network
    networkFocusID: number;
    //Id of this network
    networkID: number;

    /**
     * Constructor of the class
     * @param networkController parent object of this eventsController
     * @param htmlRef Div element where the network canvas is stored
     * @param sf State functions object
     * @param networkFocusID ID of the current network with the focus of the tooltip
     * @param networkID ID of this network
     */
    constructor(networkController: NetworkController, htmlRef: HTMLDivElement, sf: StateFunctions, networkFocusID: number, networkID: number) {

        this.bbController = networkController.bbController;
        this.nodeVisuals = networkController.nodeVisuals;
        this.edgeVisuals = networkController.edgeVisuals;

        this.refHTML = htmlRef;

        this.net = networkController.net;
        this.nodes = networkController.nodes;
        this.edges = networkController.edges;

        this.networkFocusID = networkFocusID;
        this.networkID = networkID;

        this.net.on("beforeDrawing", (ctx) => this.beforeDrawing(ctx));
        this.net.on("click", (event) => this.click(event, sf));

        this.net.on("animationFinished", () => this.animationFinished(sf.setSelectedObject));
        this.net.on("zoom", () => this.zoom(sf.setSelectedObject));
        this.net.on("dragging", () => this.dragging(sf.setSelectedObject));

        this.net.on("resize", () => this.zoomOut());
    }

    /**
     * Before drawing event callback
     * @param ctx Context of the network's canvas
     */
    beforeDrawing(ctx: CanvasRenderingContext2D) {
        this.bbController.drawBoundingBoxes(ctx);
    }

    /**
     * Click event callback
     * @param event click event
     * @param sf Object with all functions that change the state
     */
    click(event: any, sf: StateFunctions) {
        sf.setSelectedObject({ action: SelectedObjectActionEnum.clear, newValue: undefined, sourceID: this.networkID });

        if (event.nodes.length > 0) {
            sf.setNetworkFocusId(this.networkID);

            const node = this.nodes.get(event.nodes[0]) as unknown as UserData;
            sf.setSelectedObject({ action: SelectedObjectActionEnum.object, newValue: node, sourceID: this.networkID});
            
        } else {
            this.noNodeClicked(event, sf);
        }
    }

    /**
     * Animation finished event callback
     * @param setSelectedObject function that updates the tooltip
     */
    animationFinished(setSelectedObject: Dispatch<SelectedObjectAction>) {
        this.updateTooltipPosition(setSelectedObject);
    }

    /**
     * Zoom event callback
     * @param setSelectedObject function that updates the tooltip
     */
    zoom(setSelectedObject: Dispatch<SelectedObjectAction>) {
        this.updateTooltipPosition(setSelectedObject);
    }

    /**
     * Canvas dragging event callback
     * @param setSelectedObject function that updates the tooltip
     */
    dragging(setSelectedObject: Dispatch<SelectedObjectAction>) {
        this.updateTooltipPosition(setSelectedObject);
    }

    /**
     * Change the visual state of all nodes depending on their conection to the clicked node. Do the same for the edges
     * @param nodeId Id of the node clicked
     */
    nodeClicked(nodeId: number) {
        const node = this.nodes.get(nodeId) as unknown as UserData;

        this.tooltipData = node;

        //Search for the nodes that are connected to the selected Node
        const { selectedNodes, selected_edges_id } = this.edgeVisuals.getSelectedNodesAndEdges(nodeId.toString());

        //Move the "camera" to focus on these nodes
        const fitOptions: FitOptions = {
            nodes: selectedNodes,
            animation: {
                duration: nodeConst.zoomDuration,
            } as TimelineAnimationType,
        }
        this.net.fit(fitOptions);

        //Hide edges unconected
        this.edgeVisuals.selectEdges(selected_edges_id as string[]);

        //Update nodes's color acording to their selected status

        this.nodeVisuals.selectNodes(selectedNodes);
        this.net.selectNodes([node.id] as IdType[])

        return node;
    }

    /**
     * Remove all selected nodes and edges and update their visuals. 
     * If a community has been clicked, zoom in and update the dataTables and tooltip with its data
     * @param event click event
     * @param sf Object with all functions that change the state
     */
    noNodeClicked(event: any, sf: StateFunctions) {
        const boundingBoxClicked = this.bbController.isBoundingBoxClicked(event);

        if (boundingBoxClicked !== null) {
            const community: CommunityData = this.bbController.comData[boundingBoxClicked]

            sf.setNetworkFocusId(this.networkID);

            //Update community datatable  
            sf.setSelectedCommunity!(community);

            //Update tooltip
            sf.setSelectedObject({ action: SelectedObjectActionEnum.object, newValue: community, sourceID: this.networkID });
            this.tooltipData = community;

            //Zoom in to the community
            const fitOptions: FitOptions = {
                animation: {
                    duration: nodeConst.zoomDuration
                } as TimelineAnimationType,
                nodes: community.users
            }

            this.net.fit(fitOptions);

            this.removeSelectedItems();
        } else {
            //this.zoomOut();

            this.tooltipData = undefined;

            //Clear community datatable
            sf.setSelectedCommunity!(undefined);
        }

        this.removeSelectedItems();
    }

    /**
     * Zoom out to fit all nodes in the image
     */
    zoomOut() {
        const fitOptions: FitOptions = {
            animation: {
                duration: nodeConst.zoomDuration,
            } as TimelineAnimationType,
            nodes: []
        }
        this.net.fit(fitOptions);
    }

    /**
     * Remove all selected nodes and edges of the network
     */
    removeSelectedItems() {
        //Deselect everything
        this.net.unselectAll();

        //Hide edges
        this.edgeVisuals.unselectEdges();

        //Recolor all necesary nodes
        this.nodeVisuals.unselectNodes()
    }

    /**
     * Updates the tooltip position based on the saved tooltip data
     * @param setSelectedObject function that updates the tooltip
     */
    updateTooltipPosition(setSelectedObject: Dispatch<SelectedObjectAction>) {
        if (this.networkID === this.networkFocusID) {
            if (this.tooltipData !== undefined) {
                
                const refPosition = getHTMLPosition(this.refHTML);

                let x: number;
                let y: number;

                //If the tooltip data is a node
                if (this.tooltipData?.explanation === undefined) {
                    const node = this.tooltipData as UserData;

                    const nodePositionInDOM = this.net.canvasToDOM(this.net.getPosition(node.id));

                    //Depending on the zoom level and node size, we add offset to the coordinates of the tooltip
                    x = nodePositionInDOM.x + refPosition.left + 18 + 1.7 * (node.size * this.net.getScale());
                    y = nodePositionInDOM.y + refPosition.top + node.size / 2 - 3;

                } else {
                    const community = this.tooltipData as CommunityData;

                    const bb = community.bb as BoundingBox;

                    const bbLeft = this.net.canvasToDOM({
                        x: bb.left,
                        y: bb.top
                    });
                    const bbRight = this.net.canvasToDOM({
                        x: bb.right,
                        y: bb.bottom
                    });

                    //Position the tooltip at the right of the bounding box
                    x = bbRight.x + refPosition.left + 25;
                    y = bbLeft.y + (bbRight.y - bbLeft.y) / 2 + refPosition.top;

                }

                //Check if the tooltip is inside the canvas
                if (y > refPosition.top && y < refPosition.bottom &&
                    x > refPosition.left && x < refPosition.right) {
                        
                    setSelectedObject({ action: SelectedObjectActionEnum.position, newValue: { x: x, y: y }, sourceID: this.networkID });

                } else {
                    setSelectedObject({ action: SelectedObjectActionEnum.position, newValue: undefined, sourceID: this.networkID });
                }
            }

        } else
            this.tooltipData = undefined;

    }

    selectNodesByID(users: number[]) {
        this.net.selectNodes(users);

        const fitOptions: FitOptions = {
            animation: {
                duration: nodeConst.zoomDuration,
            } as TimelineAnimationType,
            nodes: users
        }

        this.net.fit(fitOptions);
    }
}



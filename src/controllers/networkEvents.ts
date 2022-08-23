/**
 * @fileoverview .
 * @author Marco Expósito Pérez
 */
//Namespaces
import { ViewOptions } from "../namespaces/ViewOptions";
import { CommunityData, EdgeData, UserData } from "../namespaces/perspectivesTypes";
import { nodeConst } from "../namespaces/nodes";
//Packages
import { DataSetEdges, DataSetNodes, Edge, Node, FitOptions, Network, TimelineAnimationType } from "vis-network";

//Local files
import BoundingBoxes, { BoundingBox } from "./boundingBoxes";
import NodeVisuals, { Point } from "./nodeVisuals";
import EdgeVisuals from "./edgeVisuals";
import { getHTMLPosition, TooltipInfo } from "../basicComponents/Tooltip";
import { DataRow } from "../basicComponents/Datatable";
import { RefObject } from "react";




export default class NetworkEvents {

    bbs: BoundingBoxes;
    nodeVisuals: NodeVisuals;
    edgeVisuals: EdgeVisuals;

    refHTML: RefObject<HTMLDivElement>;

    net: Network;
    nodes: DataSetNodes;
    edges: DataSetEdges;

    tooltipData?: UserData | CommunityData;

    constructor(network: Network, nodes: DataSetNodes, edges: DataSetEdges, boundingBoxes: BoundingBoxes, nodeVisuals: NodeVisuals, edgeVisuals: EdgeVisuals, visJsRef: RefObject<HTMLDivElement>,
        setSelNode: Function, setSelCom: Function, setTooltipInfo: Function, setTooltipPos: Function) {

        this.bbs = boundingBoxes;
        this.nodeVisuals = nodeVisuals;
        this.edgeVisuals = edgeVisuals;

        this.refHTML = visJsRef;

        this.net = network;
        this.nodes = nodes;
        this.edges = edges;

        this.net.on("beforeDrawing", (ctx) => this.beforeDrawing(ctx));
        this.net.on("click", (event) => this.click(event, setSelNode, setSelCom, setTooltipInfo));
        this.net.on("animationFinished", () => this.animationFinished(setTooltipPos));
    }

    beforeDrawing(ctx: CanvasRenderingContext2D) {
        this.bbs.drawBoundingBoxes(ctx);
    }

    click(event: any, setSelNode: Function, setSelCom: Function, setTooltipInfo: Function) {
        if (event.nodes.length > 0) {
            this.nodeClicked(event, setSelNode, setTooltipInfo);
        } else {
            this.noNodeClicked(event, setSelNode, setSelCom, setTooltipInfo);
        }
    }

    zoom() {

    }

    dragging() {

    }

    animationFinished(setTooltipPos: Function) {
        if (this.refHTML.current !== null && this.tooltipData !== undefined) {
            
            const refPosition = getHTMLPosition(this.refHTML.current);

            let x: number;
            let y: number;

            if (this.tooltipData?.explanation === undefined) {
                const node = this.tooltipData as UserData;

                const nodePositionInDOM = this.net.canvasToDOM(this.net.getPosition(node.id));

                x = nodePositionInDOM.x + refPosition.left + (node.size * this.net.getScale() * 6);
                y = nodePositionInDOM.y + refPosition.top - (node.size * this.net.getScale());

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

                x = bbRight.x + refPosition.left + 30;
                y = bbLeft.y + (bbRight.y - bbLeft.y) / 2 + refPosition.top;

            }

            setTooltipPos({ x: x, y: y } as Point);
        }

    }


    nodeClicked(event: any, setSelectedNode: Function, setTooltipInfo: Function) {
        const node = this.nodes.get(event.nodes[0]) as unknown as UserData;
        setSelectedNode(node);

        this.setNodeAsTooltip(setTooltipInfo, node);

        //Search for the nodes that are connected to the selected Node
        const selectedNodes = new Array<string>();
        selectedNodes.push(node.id.toString())

        const selected_edges_id = this.net.getConnectedEdges(selectedNodes[0]);
        const selectedEdges: Edge[] = this.edges.get(selected_edges_id);

        selectedEdges.forEach((edge: Edge) => {
            if (edge.value !== undefined && edge.value >= 0.5) {   //TODO link this with the threshold option

                if (edge.from != selectedNodes[0] && edge.to == selectedNodes[0])
                    selectedNodes.push(edge.from as string);

                else if (edge.to != selectedNodes[0] && edge.from == selectedNodes[0])
                    selectedNodes.push(edge.to as string);

            } else {
                const index = selected_edges_id.indexOf(edge.id as string);
                selected_edges_id.splice(index, 1);
            }
        });

        //Move the "camera" to focus on these nodes
        const fitOptions: FitOptions = {
            nodes: selectedNodes,
            animation: {
                duration: nodeConst.ZoomDuration,
            } as TimelineAnimationType,
        }
        this.net.fit(fitOptions);

        //Hide edges unconected
        this.edgeVisuals.selectEdges(selected_edges_id as string[]);

        //Update nodes's color acording to their selected status
        this.nodeVisuals.selectNodes(selectedNodes);
    }

    setNodeAsTooltip(setTooltipInfo: Function, node: UserData) {
        const mainRows: DataRow[] = new Array<DataRow>();

        if (!this.nodeVisuals.hideLabel) {
            mainRows.push(new DataRow("Id", node !== undefined ? node.id : ""));
            mainRows.push(new DataRow("Label", node !== undefined ? node.label : ""));
        }
        mainRows.push(new DataRow("Community", node !== undefined ? node.implicit_community : ""));

        const subRows: DataRow[] = new Array<DataRow>();

        const keys = Object.keys(node.explicit_community);
        for (let i = 0; i < keys.length; i++) {
            subRows.push(new DataRow(keys[i], node.explicit_community[keys[i]]));
        }

        const tooltipInfo = {
            tittle: "Citizen data",
            mainDataRow: mainRows,
            subDataRow: subRows
        } as TooltipInfo;

        setTooltipInfo(tooltipInfo)

        this.tooltipData = node;
    }

    noNodeClicked(event: any, setSelNode: Function, setSelCom: Function, setTooltipInfo: Function) {
        setSelNode(undefined);

        const fitOptions: FitOptions = {
            animation: {
                duration: nodeConst.ZoomDuration,
            } as TimelineAnimationType,
        }

        const boundingBoxClicked = this.bbs.isBoundingBoxClicked(event);

        if (boundingBoxClicked !== null) {
            const community: CommunityData = this.bbs.comData[boundingBoxClicked]

            //Update community datatable  
            setSelCom(community);

            //Update tooltip
            this.setCommunityAsTooltip(setTooltipInfo, community);

            //Zoom in to the community
            fitOptions.nodes = community.users;
            this.net.fit(fitOptions);

            this.removeSelectedItems();
        } else {

            //Zoom out from all nodes
            fitOptions.nodes = [];
            this.net.fit(fitOptions);

            //Clear community datatable
            setSelCom(undefined);

            //Clear tooltip data
            setTooltipInfo(undefined);
        }

        this.removeSelectedItems();
    }

    setCommunityAsTooltip(setTooltipInfo: Function, community: CommunityData) {
        const mainRows: DataRow[] = new Array<DataRow>();

        mainRows.push(new DataRow("Id", community !== undefined ? community.id : ""));
        mainRows.push(new DataRow("Name", community !== undefined ? community.name : ""));
        mainRows.push(new DataRow("Explanation", community !== undefined ? community.explanation : ""));

        const subRows: DataRow[] = new Array<DataRow>();
        if (community !== undefined && community.bb !== undefined) {
            subRows.push(new DataRow("Color", community.bb.color.name))
        }

        const tooltipInfo = {
            tittle: "Citizen data",
            mainDataRow: mainRows,
            subDataRow: subRows
        } as TooltipInfo;

        setTooltipInfo(tooltipInfo)

        this.tooltipData = community;
    }


    removeSelectedItems() {
        //Deselect everything
        this.net.unselectAll();

        //Hide edges
        this.edgeVisuals.unselectEdges();

        //Recolor all necesary nodes
        this.nodeVisuals.unselectNodes()

    }
}
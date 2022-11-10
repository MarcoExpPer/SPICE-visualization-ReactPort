/**
 * @fileoverview This class creates the controller of this network. 
 * Creating all other controllers, setting up vis.js's options and parsing the initial data.
 * @package Requires vis network package.
 * @package Requires vis data package.
 * @author Marco Expósito Pérez
 */
//Constants
import { edgeConst } from "../constants/edges";
import { IEdgeData, IPerspectiveData, IUserData } from "../constants/perspectivesTypes";
import { ViewOptions } from "../constants/viewOptions";
import { nodeConst } from "../constants/nodes";
import { IStateFunctions } from "../constants/auxTypes";
//Package
import { Data, DataSetEdges, DataSetNodes, Network, Options } from "vis-network";
import { DataSet } from "vis-data";
//Local Files
import BoxesController from "./boxesController";
import NodeDimensionStrategy from "../managers/nodeDimensionStat";
import NodeLocation from "./nodeLocation";
import NodeExplicitComms from "./nodeExplicitComms";
import NodeVisualsCtrl from "./nodeVisualsCtrl";
import EdgeVisualsCtrl from "./edgeVisualsCtrl";
import EventsCtrl from "./eventsCtrl";

export default class NetworkController {
    //Options of the vis.js network
    options!: Options;
    //Bounding boxes controller
    bbCtrl!: BoxesController;
    //Edge visuals controller
    edgeCtrl!: EdgeVisualsCtrl;
    //Node visuals controller
    nodeVisuals!: NodeVisualsCtrl;

    //Network event controller
    eventsCtrl: EventsCtrl;

    //Vis.js network object
    net!: Network;
    //Nodes of the network
    nodes: DataSetNodes;
    //Edges of the network
    edges: DataSetEdges;

    //Id of this network
    id: string;
    htmlRef: HTMLDivElement;

    //Ready flag
    isReady: boolean;
    /**
     * Constructor of the class 
     * @param perspectiveData Data of this perspective
     * @param htmlRef HTMLDiv element where the canvas of the network will be holded
     * @param viewOptions Object with the view options
     * @param sf Obkect with the functions that change the state
     * @param dimStrat Current dimension strategy
     * @param networkFocusID ID of the current network with the tooltip focus
     */
    constructor(perspectiveData: IPerspectiveData, htmlRef: HTMLDivElement, viewOptions: ViewOptions, sf: IStateFunctions,
        dimStrat: NodeDimensionStrategy | undefined, networkFocusID: string) {

        this.isReady = false;

        this.id = perspectiveData.id;
        this.htmlRef = htmlRef;

        this.nodes = new DataSet(perspectiveData.users);

        perspectiveData.similarity.sort(sortEdges);
        this.edges = new DataSet(perspectiveData.similarity);

        this.createOptions();
        this.net = new Network(htmlRef, { nodes: this.nodes, edges: this.edges } as Data, this.options);

        this.parseNodes(perspectiveData, dimStrat, sf, viewOptions);
        this.parseEdges(this.edges, perspectiveData.similarity, viewOptions);

        this.eventsCtrl = new EventsCtrl(this, sf, networkFocusID);

        this.isReady = true;
        this.eventsCtrl.zoomToNodes();
    }

    /**
     * Parse all nodes to initialize their related options and data structures.
     * @param perspectiveData data of the network
     * @param dimStrat dimension strat of all networks
     * @param sf Functions that change the state
     * @param viewOptions Options that change the visualization
     */
    parseNodes(perspectiveData: IPerspectiveData, dimStrat: NodeDimensionStrategy | undefined, sf: IStateFunctions, viewOptions: ViewOptions) {
        const explicitCtrl = new NodeExplicitComms(perspectiveData.communities);
        const nodeLocation = new NodeLocation(perspectiveData.communities.length, perspectiveData.users.length);

        perspectiveData.users.forEach((user: IUserData) => {
            explicitCtrl.parseExplicitCommunity(user, dimStrat);
            nodeLocation.updateNodeGroup(user, perspectiveData.communities);
        });
        explicitCtrl.sortExplicitData();

        this.nodeVisuals = new NodeVisualsCtrl(dimStrat, sf, explicitCtrl.explicitData, viewOptions);
        this.bbCtrl = new BoxesController(perspectiveData.communities);

        perspectiveData.users.forEach((user: IUserData) => {
            nodeLocation.setNodeLocation(user);
            this.nodeVisuals.setNodeInitialVisuals(user, viewOptions.hideLabels);
            this.bbCtrl.calculateBoundingBoxes(user);
        });

        explicitCtrl.calcExplicitPercentile(this.nodeVisuals.dimStrat);


        this.nodes.update(perspectiveData.users);
    }

    /**
     * Parse all nodes to initialize the edge visuals controller.
     * @param edgeDataset Data of the active edges
     * @param baseData Data of all edges of the network
     * @param viewOptions Options that change the visualization
     */
    parseEdges(edgeDataset: DataSetEdges, baseData: IEdgeData[], viewOptions: ViewOptions) {
        this.edgeCtrl = new EdgeVisualsCtrl(edgeDataset, baseData, viewOptions);
    }

    /**
     * Create the initial option object of vis.js
     */
    createOptions() {
        this.options = {
            autoResize: true,
            edges: {
                width: edgeConst.minWidth,
                color: {
                    color: edgeConst.defaultColor,
                    highlight: edgeConst.selectedColor
                },
                chosen: false,
                font: {
                    strokeWidth: edgeConst.LabelStrokeWidth,
                    size: edgeConst.LabelSize,
                    color: edgeConst.LabelColor,
                    strokeColor: edgeConst.LabelStrokeColor,
                    align: edgeConst.LabelAlign,
                    vadjust: edgeConst.labelVerticalAdjust
                },
                smooth: false
            },
            nodes: {
                shape: nodeConst.defaultShape.name,
                shapeProperties: {
                    interpolation: false,
                },
                borderWidth: nodeConst.defaultBorderWidth,
                size: nodeConst.defaultSize,
                chosen: false,
                color: {
                    background: nodeConst.defaultColor,
                    border: nodeConst.defaultColor,
                },
                font: {
                    vadjust: nodeConst.labelvOffset,
                    size: nodeConst.labelSize,
                }
            },
            groups: {
                useDefaultGroups: false
            },
            physics: {
                enabled: false,
            },
            interaction: {
                zoomView: true,
                dragView: true,
                hover: false,
                hoverConnectedEdges: false,
            },
            layout: {
                improvedLayout: false,
            }
        } as Options;
    }
}

/**
 * Function that compares and sort EdgeData.
 * @param a EdgeData A
 * @param b EdgeData B
 * @returns Returns 1 if A has higher value. Returns 0 if both have the same value. Returns -1 if B has higher value
 */
const sortEdges = (a: IEdgeData, b: IEdgeData) => {
    if (a.similarity > b.similarity) {
        return 1;
    }
    if (a.similarity < b.similarity) {
        return -1;
    }
    return 0;
}
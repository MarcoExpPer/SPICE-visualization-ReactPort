/**
 * @fileoverview This class find all explicit communities and its values in the user data of the perspective. 
 * Then create a dimension strategy that changes how the network ndoes look based on the explicitData.
 * Then it changes the node position in the canvas to create a circular distribution without node overlap.
 * @author Marco Expósito Pérez
 */
//Namespaces
import { PerspectiveInfo, PerspectiveData, UserData } from "../namespaces/perspectivesTypes";
import { Dimensions, DimAttribute, nodeConst } from "../namespaces/nodes"
//Local files
import NodeDimensionStrategy from "./dimensionStratController";

//Aux class to help mantain and collect all the values of an Explicit Community
class ExplicitData {
    key: string;
    values: string[];

    /**
     * Constructor of the class
     * @param key Key of the explicit community
     * @param value Initial value of the explicit community
     */
    constructor(key: string, value: string) {
        this.key = key;
        this.values = new Array<string>();
        this.values.push(value);
    }
}

interface Point {
    x: number;
    y: number;
}

interface NodeGroup {
    nodes: number[],
    partition: {
        center: Point,
        nNodes: number
    }
}

export default class UserVisuals {
    //All explicit Data of the users
    explicitData: ExplicitData[];
    //Current active dimensions strat
    dimensionsStrat!: NodeDimensionStrategy;

    /**
     * Constructor of the class
     * @param PerspectiveInfo Perspective info of the perspective that uses this object
     */
    constructor(PerspectiveInfo: PerspectiveInfo) {
        this.explicitData = new Array<ExplicitData>();

        this.obtainExplicitData(PerspectiveInfo.data.users);

        this.createNodeDimensionStrategy();

        this.updateNodeDimensionsToDefault(PerspectiveInfo.data.users);
        this.updateNodeLocation(PerspectiveInfo.data);
    }

    /**
     * Ibtain the explicit data from the explicit communities of the UserData
     * @param UsersData 
     */
    obtainExplicitData(UsersData: UserData[]) {
        UsersData.forEach((user) => {

            const explicitKeys = Object.keys(user.explicit_community);
            explicitKeys.forEach((key) => {

                if (this.explicitData.length === 0) {
                    this.explicitData.push(new ExplicitData(key, user.explicit_community[key]));
                } else {

                    let keyValues = this.explicitData.find(element => element.key === key);

                    if (keyValues !== undefined) {
                        if (!keyValues.values.includes(user.explicit_community[key])) {
                            keyValues.values.push(user.explicit_community[key]);
                        }
                    } else {
                        this.explicitData.push(new ExplicitData(key, user.explicit_community[key]));
                    }
                }
            });
        });
    }

    /**
     * Create the node dimension strategy and its necesary attributes
     */
    createNodeDimensionStrategy() {
        const attributes = new Array<DimAttribute>();

        if (this.explicitData[0] !== undefined) {
            attributes.push({
                key: this.explicitData[0].key,
                values: this.explicitData[0].values,
                dimension: Dimensions.Color,
            })
        }

        if (this.explicitData[1] !== undefined) {
            attributes.push({
                key: this.explicitData[1].key,
                values: this.explicitData[1].values,
                dimension: Dimensions.Shape,
            })
        }

        //TODO link the allow third dimension option tho this
        if (this.explicitData[2] !== undefined && false) {
            attributes.push({
                key: this.explicitData[2].key,
                values: this.explicitData[2].values,
                dimension: Dimensions.Border,
            })
        }

        this.dimensionsStrat = new NodeDimensionStrategy(attributes);
    }

    /**
     * Update node dimensions to default state
     * @param UsersData users to update
     */
    updateNodeDimensionsToDefault(UsersData: UserData[]) {
        if (this.dimensionsStrat !== undefined) {

            UsersData.forEach((user) => {
                this.dimensionsStrat?.nodeToDefault(user);
            });

        } else {
            console.log("Trying to update node visuals without dimension strat being defined")
        }
    }

    /**
     * Update the location of the nodes in the canvas to resemble a circle without node overlaps
     * @param networkData Data of the perspective
     */
    updateNodeLocation(networkData: PerspectiveData) {
        const nAreas = networkData.communities.length;

        const areaPartitions: Point[] = this.createNetworkPartitions(networkData.users.length, nAreas);
        const nodesGrouped: Array<NodeGroup> = new Array<NodeGroup>();

        for (let i = 0; i < nAreas; i++) {
            nodesGrouped.push({
                nodes: new Array<number>(),
                partition: {
                    center: areaPartitions[i],
                    nNodes: 0
                }
            })
        }

        //Insert the nodes in each nodeGroup
        networkData.users.forEach((user) => {
            const group = user.implicit_community;

            nodesGrouped[group].nodes.push(user.id);
            nodesGrouped[group].partition.nNodes++;
        });

        //Set the location for all nodes
        networkData.users.forEach((user) => {

            const group = user.implicit_community;
            const nodePos: Point = this.getNodePos(nodesGrouped[group], user.id);

            user.x = nodePos.x;
            user.y = nodePos.y;
        });
    }

    /**
     * Create partitions in a circle to slot every implicit community
     * @param nUsers number of users
     * @param nAreas number of areas to make
     * @returns returns an array with the center poin of each partition
     */
    createNetworkPartitions(nUsers: number, nAreas: number): Point[] {
        const partitionsDistance = nodeConst.groupsBaseDistance * nUsers / 45;
        const pi2 = (2 * Math.PI);

        //Separate the network area in as many angle slices as necesary
        const angleSlice = pi2 / nAreas;
        let targetAngle = 0;

        //Increase the target angle for every group, and set the location of each area partition
        const areaPartitions = [];
        for (let i = 0; targetAngle < pi2; i++) {
            areaPartitions[i] = {
                x: Math.cos(targetAngle) * (partitionsDistance * nAreas),
                y: Math.sin(targetAngle) * (partitionsDistance * nAreas)
            };

            targetAngle += angleSlice;
        }


        return areaPartitions as Point[];
    }

    /**
     * Gets the exact node coordinates in the canvas
     * @param group Node group of the node
     * @param nodeId id of the node
     * @returns point coordinates
     */
    getNodePos(group: NodeGroup, nodeId: number): Point {
        const size = group.partition.nNodes;
        const center = group.partition.center;
        const nodeIndex = group.nodes.indexOf(nodeId);;

        const output = { x: 0, y: 0 };

        const angleSlice = (2 * Math.PI) / size;
        let targetAngle = angleSlice * nodeIndex;

        output.x = center.x + Math.cos(targetAngle) * size * nodeConst.betweenNodesDistance;
        output.y = center.y + Math.sin(targetAngle) * size * nodeConst.betweenNodesDistance;

        return output;
    }
}
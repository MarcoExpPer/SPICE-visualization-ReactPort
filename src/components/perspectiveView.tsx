/**
 * @fileoverview This file creates a Vis.js network based on the perspectiveData and also mantains the dataColumn of this network
 * @package It requires React package. 
 * @package It requires vis-network package. 
 * @package It requires vis-data package. 
 * @author Marco Expósito Pérez
 */

//TODO currently is highly on development

//Namespaces
import { ViewOptions, AppLayout } from '../namespaces/ViewOptions';
import { PerspectiveInfo, UserData } from '../namespaces/perspectivesTypes';

//Packages
import { useEffect, useState, useRef } from "react";
import { DataSet } from "vis-data";
import { Data, Network, Node, Edge } from "vis-network";

//Local files
import { DataColumn } from "./DataColumn";
import UserVisuals from "../controllers/nodeVisuals";

interface PerspectiveViewProps {
    //Data of this perspective view.
    perspectiveInfo: PerspectiveInfo;
    //Options that change the view of a perspective
    viewOptions: ViewOptions;
    //Function to select a node
    layout: AppLayout;
    //Optional parameter to know if the its the first perspective of the pair, to mirror the table position in the horizontal layout
    isFirstPerspective?: boolean;
    //Current selected node
    selectedNode: UserData | undefined;
    //Function to select a node
    setSelectedNode: Function;
}

const options = {
    autoResize: true,
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
};


let network: Network | null | undefined = undefined;
let nodes: DataSet<UserData, "id"> | undefined = undefined;
let edges: DataSet<Edge, "id"> | undefined = undefined;

/**
 * Basic UI component that execute a function when clicked
 */
export const PerspectiveView = ({
    perspectiveInfo,
    viewOptions,
    layout,
    isFirstPerspective = true,
    selectedNode,
    setSelectedNode,
}: PerspectiveViewProps) => {

    const [info, setInfo] = useState<PerspectiveInfo>(perspectiveInfo);
    const visJsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setInfo(perspectiveInfo);
    }, [perspectiveInfo]);

    useEffect(() => {
        if (nodes === undefined) {
            const userVisuals = new UserVisuals(info);
            nodes = new DataSet(info.data.users);
        }

        if (edges === undefined)
            edges = new DataSet(info.data.similarity);

        if (network === undefined)
            network = visJsRef.current && new Network(visJsRef.current, { nodes, edges } as Data, options);

        network?.on("click", (event) => {

            if (event.nodes.length > 0 && nodes !== undefined) {
                let node = nodes.get(event.nodes[0]) as unknown as UserData;
                node.color = { background: "black" }
                nodes.update(node);

                setSelectedNode(node);
            }
        });

    }, [visJsRef, nodes, edges]);




    const dataCol = <DataColumn
        tittle={info?.info.name}
        node={selectedNode}
        community={info?.data.communities[0]}
    />

    if (isFirstPerspective || layout === AppLayout.Vertical) {
        return (
            <div className="perspective row">
                <div className="col-4">
                    {dataCol}
                </div>
                <div className="col-8">
                    <div className="network-container" ref={visJsRef} />
                </div>
            </div >
        );
    } else {
        return (
            <div className="perspective row">
                <div className="col-8">
                    <div className="network-container" ref={visJsRef} />
                </div>
                <div className="col-4">
                    {dataCol}
                </div>
            </div >
        );
    }
};

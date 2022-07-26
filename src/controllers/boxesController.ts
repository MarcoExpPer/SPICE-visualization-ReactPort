/**
 * @fileoverview This class controls where bounding boxes should be drawn and when a click hits a bounding box.
 * @author Marco Expósito Pérez
 */
//Constants
import { ECommunityType, ICommunityData, IUserData } from "../constants/perspectivesTypes";
import { IBoundingBox } from "../constants/auxTypes";

/**
 * Configuration of the bounding boxes
 */
const configuration = {
    //Padding to make bounding boxes a bit bigger than the nodes they bound.
    padding: 15,
    //width of the border of the bounding boxes.
    boderWidth: 4,
    //backgroundColor and border color of the bounding boxes.
    color: [
        {
            color: "rgba(248, 212, 251, 0.6)", border: "rgba(242, 169, 249, 1)", name: "Purple" //purple
        }, {
            color: "rgba(255, 255, 170, 0.6)", border: "rgba(255, 222, 120, 1)", name: "Yellow" //Yellow
        }, {
            color: "rgba(211, 245, 192, 0.6)", border: "rgba(169, 221, 140, 1)", name: "Green" //Green
        }, {
            color: "rgba(254, 212, 213, 0.6)", border: "rgba(252, 153, 156, 1)", name: "Red" //Red
        }, {
            color: "rgba(220, 235, 254, 0.6)", border: "rgba(168, 201, 248, 1)", name: "Blue" //Blue
        }, {
            color: "rgba(250, 220, 185, 0.6)", border: "rgba(250, 169, 73, 1)", name: "Orange" //orange
        }, {
            color: "rgba(240, 240, 240, 0.6)", border: "rgba(230, 230, 230, 1)", name: "White" //white
        }, {
            color: "rgba(10, 10, 10, 0.6)", border: "rgba(0, 0, 0, 1)", name: "Black" //black
        }
    ],
    inexistentColor: {
        color: "rgba(0, 0, 0, 0.0)", border: "rgba(0, 0, 0, 0)", name: "Transparent" //black
    }
}

export default class BoxesController {
    /**
     * Data of all communities of the network
     */
    comData: ICommunityData[]

    /**
     * Constructor of the class
     * @param communityData Data of all communities of the network
     */
    constructor(communityData: ICommunityData[]) {
        this.comData = communityData;
    }

    /**
     * Calculates the boundaries of each bounding box and add them to their own community
     * @param node Data of all users of the network
     */
    calculateBoundingBoxes(node: IUserData) {
        const group: number = node.implicit_community;

        const nodeBB: IBoundingBox = {
            top: node.y - node.size / 2 - configuration.padding,
            bottom: node.y + node.size / 2 + configuration.padding,
            left: node.x - node.size / 2 - configuration.padding,
            right: node.x + node.size / 2 + configuration.padding
        }

        if (this.comData[group].bb === undefined) {

            this.comData[group].bb = nodeBB;

            if (this.comData[group].type !== ECommunityType.inexistent) {
                this.comData[group].bb.color = configuration.color[group % configuration.color.length];
            } else {
                this.comData[group].bb.color = configuration.inexistentColor;
            }

        } else {
            if (nodeBB.left < this.comData[group].bb.left)
                this.comData[group].bb.left = nodeBB.left;

            if (nodeBB.top < this.comData[group].bb.top)
                this.comData[group].bb.top = nodeBB.top;

            if (nodeBB.right > this.comData[group].bb.right)
                this.comData[group].bb.right = nodeBB.right;

            if (nodeBB.bottom > this.comData[group].bb.bottom)
                this.comData[group].bb.bottom = nodeBB.bottom;
        }
    }

    /**
     * Draw the bounding boxes in the canvas
     * @param ctx CanvasRenderingContext2D of the network/canvas where we are going to draw
     */
    drawBoundingBoxes(ctx: CanvasRenderingContext2D) {
        for (let i = 0; i < this.comData.length; i++) {
            if (this.comData[i].bb !== undefined) {

                const bb: IBoundingBox = this.comData[i].bb;

                //Draw Border
                ctx.lineWidth = configuration.boderWidth;
                ctx.strokeStyle = bb.color!.border;
                ctx.strokeRect(bb.left, bb.top, bb.right - bb.left, bb.bottom - bb.top);

                //Draw Background
                ctx.lineWidth = 0;
                ctx.fillStyle = bb.color!.color;
                ctx.fillRect(bb.left, bb.top, bb.right - bb.left, bb.bottom - bb.top);
            }
        }
    }

    /**
     * Check if a Vis.js click event has clicked a bounding box
     * @param event Vis.js click event object
     * @returns returns the index of the clicked bounding box or null if the event doesnt click any bounding box
     */
    isBoundingBoxClicked(event: any) {
        const x = event.pointer.canvas.x;
        const y = event.pointer.canvas.y;

        for (let i = 0; i < this.comData.length; i++) {
            if (this.clickInsideBox(this.comData[i].bb, x, y)) {
                return i;
            }
        }
        return null;
    }

    /**
     * Checks if the click has hit the bb
     * @param bb BB to compare
     * @param x X of the click
     * @param y Y of the click
     * @returns True if the click is inside the bounding box
     */
    clickInsideBox(bb: IBoundingBox, x: number, y: number) {
        return x > bb.left && x < bb.right && y > bb.top && y < bb.bottom;
    }
}
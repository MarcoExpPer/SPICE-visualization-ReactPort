/**
 * @fileoverview This file is the entry point of the application. 
 * 
 * - Holds the states with all the info necesary for the application.
 * - Creates the toolbar/navbar component,
 * - Creates the perspectives Groups component for the visualization.
 * 
 * @package Requires React package. 
 * @author Marco Expósito Pérez
 */
//Constants
import { EFileSource, EButtonState, ViewOptions, viewOptionsReducer, EAppCollapsedState, collapseReducer, initialOptions } from './constants/viewOptions';
import { PerspectiveActiveState, IPerspectiveData, PerspectiveId } from './constants/perspectivesTypes';
import { ILegendData, legendDataReducer } from './constants/auxTypes';
import './style/base.css';
//Packages
import React, { useEffect, useReducer, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
//Local files
import { EScreenSize, Navbar } from './basicComponents/Navbar';
import { Button } from './basicComponents/Button';
import { PerspectivesGroups } from './components/PerspectivesGroup';
import { LegendComponent } from './components/LegendComponent';
import { SelectPerspectiveDropdown } from './components/SelectPerspectiveDropdown';
import RequestManager from './managers/requestManager';
import { ILoadingState, LoadingFrontPanel } from './basicComponents/LoadingFrontPanel';
import { DropMenu, EDropMenuDirection } from './basicComponents/DropMenu';
import { ConfigurationTool } from './components/ConfigurationTool';
import { AllVisirOptions } from './components/AllVisirOptions';
import { SavePerspectives } from './components/SavePerspectives';
import { CTranslation, ITranslation } from './managers/CTranslation';


interface AppProps {
  perspectiveId1: string | null,
  perspectiveId2: string | null,
  apiURL: string,
  apiUSER: string,
  apiPASS: string
}

export const App = ({

  perspectiveId1,
  perspectiveId2,
  apiURL,
  apiUSER,
  apiPASS
}: AppProps) => {

  const [currentLanguage, setCurrentLanguage] = useState<ITranslation | undefined>(undefined)

  useEffect(() => {
    new CTranslation().initializeTranslation(setCurrentLanguage)
  }, [])

  //State to activate/disactivate and edit the loading spinner.
  const [loadingState, SetLoadingState] = useState<ILoadingState>({ isActive: false })

  const [requestManager] = useState<RequestManager>(new RequestManager(SetLoadingState, currentLanguage, apiURL,
    apiUSER, apiPASS));

  useEffect(() => {
    if (requestManager)
      requestManager.translation = currentLanguage;

  }, [currentLanguage, requestManager]);

  //Current options that change how the user view each perspective
  const [viewOptions, setViewOptions] = useReducer(viewOptionsReducer, new ViewOptions());
  const [fileSource, setFileSource] = useState<[EFileSource, string, string, string]>([initialOptions.fileSource, apiURL, apiUSER, apiPASS])

  //Current dimension attributes data to create the legend buttons/options
  const [legendData, setLegendData] = useReducer(legendDataReducer, { dims: [], anonymous: false, anonGroup: false } as ILegendData);

  //Current available perspectives for the dropdowns
  const [allPerspectivesIds, setAllPerspectivesIds] = useState<PerspectiveId[]>([]);

  //Current Active perspectives in the view group
  const [leftPerspective, setLeftPerspective] = useState<IPerspectiveData>();
  const [rightPerspective, setRightPerspective] = useState<IPerspectiveData>();

  //Current state of the perspectives collapse buttons
  const [collapseState, setCollapseState] = useReducer(collapseReducer, EAppCollapsedState.unCollapsed);

  const [isConfigToolActive, setIsConfigToolActive] = useState<boolean>(false);
  const [isSavePerspectiveActive, setIsSavePerspectiveActive] = useState<boolean>(false);

  const [windowWidth, setWindowWidth] = useState<number>(Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0));
  //Re-render the component when the windows is resized
  useEffect(() => {
    function onWindowResize() {
      setWindowWidth(Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0));
    }

    window.addEventListener('resize', onWindowResize)
  })


  const updateFileSource = (fileSource: EFileSource, changeItemState?: Function, apiURL?: string,
    apiUser?: string, apiPass?: string) => {

    setFileSource([fileSource, apiURL ? apiURL : "", apiUser ? apiUser : "", apiPass ? apiPass : ""]);

    requestManager.changeBaseURL(fileSource, apiURL, apiUser, apiPass);
    requestManager.requestAllPerspectivesIds((newIds: PerspectiveId[]) => {
      initPerspectivess(setLeftPerspective, setRightPerspective, newIds, perspectiveId1, requestManager, perspectiveId2,
        setAllPerspectivesIds);
    }, changeItemState);
  }

  //Remove components from the navBar and add them to the hamburger btn based on the viewport width
  let screenSize: EScreenSize = windowWidth < 600 ? EScreenSize.smallest :
    windowWidth < 1200 ? EScreenSize.small : EScreenSize.normal;

  //------------------------------------//
  //--- CREATE ALL NAVBAR COMPONENTS ---//
  //------------------------------------//

  let keyIndex = 0;
  const visirBtn =
    <Button
      key={++keyIndex}
      content={
        <div className='row' style={{ alignItems: "center" }}>
          <img style={{ height: "40px" }} src="./images/VISIR-red.png" alt="VISIR icon" />
          <div className="tittle" style={{ marginLeft: "10px" }}>VISIR</div>
        </div>}
      extraClassName="transparent tittle mainBtn"
      onClick={() => { window.location.reload() }}
    />

  const allVIsirOptions =
    <AllVisirOptions
      key={++keyIndex}
      setViewOptions={setViewOptions}
      translation={currentLanguage}
      viewOptions={viewOptions}
      setFileSource={updateFileSource}
      curentFileSource={fileSource}
    />;

  const savePerspectives =
    <Button
      key={++keyIndex}
      content={<FontAwesomeIcon color='black' size='xl' icon={["fas", "floppy-disk"]} />}
      extraClassName={"transparent"}
      hoverText={currentLanguage?.toolbar.savePerspective.hoverText}
      onClick={(state: EButtonState) => {
        if (state !== EButtonState.disabled) {
          setIsSavePerspectiveActive(!isSavePerspectiveActive);
        }
      }}
      state={isSavePerspectiveActive ? EButtonState.active : EButtonState.unactive}
    />

  const configToolBtn =
    <Button
      key={++keyIndex}
      content={<FontAwesomeIcon color='black' size='xl' icon={["fas", "screwdriver-wrench"]} />}
      extraClassName={`transparent`}
      onClick={(state: EButtonState) => {
        if (state !== EButtonState.disabled) {
          setIsConfigToolActive(!isConfigToolActive);
        }
      }}
      state={isConfigToolActive ? EButtonState.active : EButtonState.unactive}
      hoverText={currentLanguage?.toolbar.perspectiveBuilder.hoverText}
    />

  const leftSelectBtn =
    <SelectPerspectiveDropdown
      key={++keyIndex}
      tittle={`${currentLanguage?.toolbar.selectPerspective.unselectedName} A`}
      setAllIds={setAllPerspectivesIds}
      setActivePerspective={setLeftPerspective}
      allIds={allPerspectivesIds}
      isLeftDropdown={true}
      requestMan={requestManager}
      insideHamburger={screenSize === EScreenSize.smallest}
      translation={currentLanguage}
    />

  //Button to collapse the visualization to the left if there are more than 1 active perspectove
  const leftCollapse =
    <div>
      <Button
        key={++keyIndex}
        content="<"
        onClick={(state: EButtonState) => {
          if (state !== EButtonState.disabled) {
            setCollapseState(EAppCollapsedState.toTheLeft);
          }
        }}
        extraClassName={`first dark`}
        state={leftPerspective !== undefined && rightPerspective !== undefined ? EButtonState.unactive : EButtonState.disabled}
        hoverText={currentLanguage?.toolbar.collapseBtns.leftHoverText}
      />
    </div>

  const updateBtn =
    <Button
      key={++keyIndex}
      content={<FontAwesomeIcon color='white' style={{ height: "1rem" }} icon={["fas", "arrows-rotate"]} />}
      onClick={() => {
        updateFileSource(fileSource[0], () => { }, fileSource[1], fileSource[2], fileSource[3]);
      }}
      extraClassName={"mid dark"}
      hoverText={currentLanguage?.toolbar.updateBtn.hoverText}
    />

  //Button to collapse the visualization to the right if there are more than 1 active perspectove
  const rightCollapse =
    <div>
      <Button
        key={++keyIndex}
        content=">"
        extraClassName={`second dark`}
        onClick={(state: EButtonState) => {
          if (state !== EButtonState.disabled) {
            setCollapseState(EAppCollapsedState.toTheRight);
          }
        }}
        state={leftPerspective !== undefined && rightPerspective !== undefined ? EButtonState.unactive : EButtonState.disabled}
        hoverText={currentLanguage?.toolbar.collapseBtns.rightHoverText}
      />
    </div>

  const rightSelectBtn =
    <SelectPerspectiveDropdown
      key={++keyIndex}
      tittle={`${currentLanguage?.toolbar.selectPerspective.unselectedName} B`}
      setAllIds={setAllPerspectivesIds}
      setActivePerspective={setRightPerspective}
      allIds={allPerspectivesIds}
      isLeftDropdown={false}
      requestMan={requestManager}
      insideHamburger={screenSize === EScreenSize.smallest}
      translation={currentLanguage}
    />
  const legendBtn =
    <LegendComponent
      key={++keyIndex}
      legendData={legendData}
      legendConf={viewOptions.legendConfig}
      onLegendClick={(newMap: Map<string, boolean>) => {
        setViewOptions({ updateType: "legendConfig", newValue: newMap, });
      }}
      translation={currentLanguage}
    />

  const hamburgerContent = [];
  let navBar: React.ReactNode;

  //Based on the screenshize, add diferent components to the hamburger button.
  switch (screenSize) {
    case EScreenSize.smallest: {
      hamburgerContent.push(allVIsirOptions);
      hamburgerContent.push(savePerspectives);
      hamburgerContent.push(configToolBtn);
      hamburgerContent.push(leftSelectBtn);
      hamburgerContent.push(updateBtn);
      hamburgerContent.push(rightSelectBtn);

      const hamburgerBtn =
        <DropMenu
          content={
            <div className='row' style={{ alignItems: "center", height: "40px" }}>
              <FontAwesomeIcon color='black' style={{ height: "2.1rem" }} icon={["fas", "bars"]} />
            </div>}
          extraClassButton="transparent mainBtn"
          menuDirection={EDropMenuDirection.down}

          items={hamburgerContent}
        />

      navBar =
        <Navbar
          leftAlignedItems={[hamburgerBtn]}
          midAlignedItems={[
            <div style={{ display: "inline-flex", justifyContent: "center", alignItems: "center" }}>
              {leftCollapse}
              {rightCollapse}
            </div>,
          ]}
          rightAlignedItems={[
            <div style={{ marginLeft: "auto" }}>
              {legendBtn}
            </div>
          ]}
        />
      break;
    }
    case EScreenSize.small: {
      hamburgerContent.push(allVIsirOptions);
      hamburgerContent.push(savePerspectives);
      hamburgerContent.push(configToolBtn);

      const hamburgerBtn =
        <DropMenu
          content={
            <div className='row' style={{ alignItems: "center", height: "40px" }}>
              <FontAwesomeIcon color='black' style={{ height: "2.1rem" }} icon={["fas", "bars"]} />
            </div>}
          extraClassButton="transparent mainBtn"
          menuDirection={EDropMenuDirection.down}

          items={hamburgerContent}
        />

      navBar = <Navbar
        leftAlignedItems={[hamburgerBtn]}
        midAlignedItems={[
          <div style={{ marginLeft: "5px", width: "30vw" }}>
            {leftSelectBtn}
          </div>,
          <div style={{ display: "inline-flex", justifyContent: "center", alignItems: "center" }}>
            {leftCollapse}
            {updateBtn}
            {rightCollapse}
          </div>,
          <div style={{ marginRight: "5px", width: "30vw" }}>
            {rightSelectBtn}
          </div>,

        ]}
        rightAlignedItems={[
          <div style={{ marginLeft: "auto" }}>
            {legendBtn}
          </div>
        ]}
      />
      break;
    }
    default: {
      navBar =
        <Navbar
          leftAlignedItems={[
            visirBtn,
            <div style={{ display: "inline-flex", borderRight: "black solid 1px" }}>
              {allVIsirOptions}
            </div>,
            <div style={{ display: "inline-flex" }}>
              {savePerspectives}
              {configToolBtn}
            </div>
          ]}
          midAlignedItems={[
            <div style={{ marginLeft: "5px", width: "25vw" }}>
              {leftSelectBtn}
            </div>,
            <div style={{ display: "inline-flex", justifyContent: "center", alignItems: "center" }}>
              {leftCollapse}
              {updateBtn}
              {rightCollapse}
            </div>,
            <div style={{ marginRight: "5px", width: "25vw" }}>
              {rightSelectBtn}
            </div>,

          ]}
          rightAlignedItems={[
            <div style={{ marginLeft: "auto" }}>
              {legendBtn}
            </div>
          ]}
        />
      break;
    }
  }

  //Executed when its necesary to cancel the loading of a perspective
  function cancelPerspective(idToCancel: string) {
    const allIds: PerspectiveId[] = JSON.parse(JSON.stringify(allPerspectivesIds));

    for (let id of allIds) {
      if (id.id === idToCancel) {
        if (id.isActive === PerspectiveActiveState.left) {
          setLeftPerspective(undefined);
        } else {
          setRightPerspective(undefined);
        }

        alert(`Perspective ${id.name} has diferent attributes than the other active perspective.`)
        id.isActive = PerspectiveActiveState.unactive;
        break;
      }
    }

    setAllPerspectivesIds(allIds);
  }

  return (
    <div>
      {navBar}
      <span key={0} style={{ height: "75px", display: "flex" }}></span>
      <PerspectivesGroups
        key={1}
        leftPerspective={leftPerspective}
        rightPerspective={rightPerspective}
        collapsedState={collapseState}
        viewOptions={viewOptions}
        setLegendData={setLegendData}
        translation={currentLanguage}
        cancelPerspective={cancelPerspective}
      />

      <ConfigurationTool
        key={2}
        requestManager={requestManager}
        isActive={isConfigToolActive}
        setIsActive={setIsConfigToolActive}
        updateFileSource={updateFileSource}
        translation={currentLanguage}
      />

      <SavePerspectives
        key={3}
        isActive={isSavePerspectiveActive}
        setIsActive={setIsSavePerspectiveActive}
        allPerspectivesIds={allPerspectivesIds}
        updateFileSource={updateFileSource}
        requestManager={requestManager}
        translation={currentLanguage}
      />

      <LoadingFrontPanel
        key={4}
        state={loadingState}
      />
    </div>);
}


function initPerspectivess(setLeftPerspective: React.Dispatch<React.SetStateAction<IPerspectiveData | undefined>>,
  setRightPerspective: React.Dispatch<React.SetStateAction<IPerspectiveData | undefined>>,
  newIds: PerspectiveId[],
  perspectiveId1: string | null,
  requestManager: RequestManager,
  perspectiveId2: string | null,
  setAllPerspectivesIds: React.Dispatch<React.SetStateAction<PerspectiveId[]>>) {
  setLeftPerspective(undefined);
  setRightPerspective(undefined);

  if (newIds) {
    for (let i = 0; i < newIds.length; i++) {

      if (newIds[i].id === perspectiveId1) {
        newIds[i].isActive = PerspectiveActiveState.left;
        requestManager.requestPerspectiveFIle(perspectiveId1, newIds[i].name, setLeftPerspective);

      } else if (newIds[i].id === perspectiveId2 && perspectiveId2 !== perspectiveId1) {

        newIds[i].isActive = PerspectiveActiveState.right;
        requestManager.requestPerspectiveFIle(perspectiveId2, newIds[i].name, setRightPerspective);

      } else {

        newIds[i].isActive = PerspectiveActiveState.unactive;
      }
    }

    setAllPerspectivesIds(newIds);
  } else {
    setAllPerspectivesIds([]);
  }
}
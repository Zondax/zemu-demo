/** ******************************************************************************
 *  (c) 2021 Zondax GmbH
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 ******************************************************************************* */

import Zemu from '@zondax/zemu'

// Options to start Zemu with
// All timings are in ms
const startOptions = {
    //Specify for which device the app was built for
    //supported values are: "nanos", "nanox"
    model: "nanox",

    //Enable logging of all Zemu actions to console (with timestamp)
    logging: false,

    //Indicate wheter an X11 window will be displayed with the emulated screen or not
    //You can interfact with the window with your arrow keys
    //Press both arrow to signal to click both
    X11: false,

    //Delay between starting the emulator and attempting to connect to it
    startDelay: 3500,

    //Delay between pressing and releasing the button
    pressDelay: 250,
    //Delay before taking a snapshot after releasing the button
    //This allows speculos to repaint after an event
    pressDelayAfter: 700,

    //Custom arguments to be passed directly to speculos
    //Check speculos documentation for valid arguments
    custom: '',
}

const EXAMPLE_MNEMONIC: string = "equip will roof matter pink blind book anxiety banner elbow sun young";

//Will pull the image used by Zemu if not present already
await Zemu.checkAndPullImage()

//Will trow an error if the elf metadata doesn't match
// the provided model
Zemu.checkElf("nanox", "app.elf");

const sim = new Zemu(require('path').resolve("app.elf"))


//start simulation, enable logging, X11 and pass a custom mnemonic for seed
try {
    await sim.start({ ...startOptions, logging: true, X11: true, custom: `-s ${EXAMPLE_MNEMONIC}` })

    //Simply wait some ms
    await Zemu.sleep(100);
    //retrieve a @ledgerhq/hw-transport Transport
    sim.getTransport();

    //self explanatory, will signal the app with the corresponding button events
    await sim.clickRight();
    await sim.clickLeft();
    await sim.clickBoth()

    //will take a snapshot of the current frame
    //and save it at the provided path
    await sim.snapshot("screen.png")

    //The first parameter is the root folder where both:
    //  * the reference snapshots (snapshots)
    //  * the temporary snapshots (snapshots-tmp)
    //will be stored.
    //The second is the name of the folder to create under the snapshots root folder
    //to categorize the snapshots
    //Each snapshot has the following filename format "00001.png"
    //each subsequent snapshot increases the number
    //The last parameter is the list of movements to execute,
    // each positive number represents the number of right clicks
    // while negative numbers represent the number of left clicks
    // 0 is special and represents clicking both buttons
    await sim.navigateAndCompareSnapshots("root_folder", "session_folder", [3, -1, 1, 0]);

    //will retrieve the saved image of the main menu
    //taken when the app was started
    sim.getMainMenuSnapshot()

    //Wait with a configurable timeout (20000 ms) until the screen changes from the given one
    //useful when issuing a command that requires confirmation
    await sim.waitUntilScreenIsNot(sim.getMainMenuSnapshot(), 20000);

    //This is useful when making a request to the app that needs interaction
    //The following is a code example on how to issue a request to the app
    //while interacting with it

    //const fooReq = app.foo(args);

    //Allow the app time to move out of the main menu
    await sim.waitUntilScreenIsNot(sim.getMainMenuSnapshot(), 10000);
    //move 3 times right and then click both
    await sim.navigateAndCompareSnapshots(".", "demo", [3, 0]);

    //Awaiting the promise will yield the result after all the navigation has been done
    //const foo = await fooReq;
} finally {
    //it's important to close off the simulation before exiting the script!
    await sim.close()
}

//This function tries to stop all running containers
//used for the emulation (since multiple can be started)
//otherwise exits the process after 10s
await Zemu.stopAllEmuContainers()
